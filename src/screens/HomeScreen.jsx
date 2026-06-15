import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import { fetchDashboard, updateWater } from "../utils/meals";

import AppHeader from "../components/AppHeader";
import ClayCard from "../components/ClayCard";
import DateSelector from "../components/DateSelector";
import MacroSummary from "../components/MacroSummary";
import colors from "../constants/colors";
import { dummyTasks } from "../data/dummyTasks";
import { useApp } from "../utils/appState";
import { calculateDayTotals, calculateRemainingCalories } from "../utils/calorieCalculator";
import { formatCalories, getDateLabel, toApiDateString } from "../utils/formatters";

const taskIcons = {
  water: "water-outline",
  breakfast: "sunny-outline",
  all_meals: "restaurant-outline"
};

function CalorieRing({ achieved, goal, dark = false }) {
  const size = 140;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeGoal = Number(goal) || 0;
  const safeAchieved = Number(achieved) || 0;
  const progress = safeGoal ? Math.min(1, safeAchieved / safeGoal) : 0;
  const ringColor = safeGoal > 0 && safeAchieved > safeGoal ? colors.coral : colors.primary;

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E4F0DB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - progress * circumference}
          fill="transparent"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className={`text-3xl font-black ${dark ? "text-white" : "text-ink"}`}>{Math.round(achieved)}</Text>
        <Text className={`text-xs font-bold ${dark ? "text-white/60" : "text-cocoa"}`}>of {Math.round(goal)}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { profile, meals, isDark, dashboardRefreshKey } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [waterSummary, setWaterSummary] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  const loadDashboard = useCallback(async () => {
    const data = await fetchDashboard(toApiDateString(selectedDate));
    const nextWaterSummary = data?.water ?? (data?.amount_ml !== undefined ? data : null);

    setDashboardSummary(data);

    if (nextWaterSummary) {
      setWaterSummary(nextWaterSummary);
      setWaterGlasses(Math.round((Number(nextWaterSummary.amount_ml) || 0) / 250));
    }
  }, [selectedDate]);

  const handleWaterSubmit = async () => {
    const amountMl = waterGlasses * 250;
    try {
      const res = await updateWater(toApiDateString(selectedDate), amountMl);
      const nextWaterSummary = res?.water ?? res;
      const nextAmountMl = Number(nextWaterSummary?.amount_ml ?? amountMl);

      setWaterSummary(nextWaterSummary);
      setWaterGlasses(Math.round(nextAmountMl / 250));
      loadDashboard().catch((error) => {
        console.error("[HomeScreen] waterDashboardRefresh:error", error);
      });
      Alert.alert("Water intake updated", `${nextAmountMl}ml logged`);
    } catch (error) {
      Alert.alert("Water update failed", "Please try again.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard().catch((error) => {
        console.error("[HomeScreen] fetchDashboard:error", error);
      });
    }, [loadDashboard])
  );

  useEffect(() => {
    loadDashboard().catch((error) => {
      console.error("[HomeScreen] dashboardRefresh:error", error);
    });
  }, [dashboardRefreshKey, loadDashboard]);

  const totals = useMemo(() => dashboardSummary?.consumed ?? calculateDayTotals(meals), [dashboardSummary, meals]);
  const targets = dashboardSummary?.daily_goal ?? profile.targets;
  const remaining = Number(
    dashboardSummary?.remaining_calories ?? calculateRemainingCalories(targets.calories, totals.calories)
  );
  const dashboardTasks = useMemo(
    () =>
      Array.isArray(dashboardSummary?.tasks)
        ? dashboardSummary.tasks.map((task) => ({
            ...task,
            icon: taskIcons[task.id] || "checkmark-circle-outline"
          }))
        : dummyTasks,
    [dashboardSummary]
  );
  const waterAmountMl = Number(waterSummary?.amount_ml ?? waterGlasses * 250);
  const waterGoalMl = Number(waterSummary?.goal_ml ?? 2000);
  const waterRemainingMl = Number(waterSummary?.remaining_ml ?? Math.max(waterGoalMl - waterAmountMl, 0));
  const waterProgressPercent = Number(
    waterSummary?.progress_percent ?? (waterGoalMl ? Math.min(100, Math.round((waterAmountMl / waterGoalMl) * 100)) : 0)
  );
  const waterProgressWidth = `${Math.max(0, Math.min(100, waterProgressPercent))}%`;
  const waterAmountGlasses = waterGlasses;
  const waterGoalGlasses = Math.max(1, Math.round(waterGoalMl / 250));

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title={`Good Morning, ${profile.name}`} subtitle={getDateLabel(selectedDate)} dark={isDark} />
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} dark={isDark} />

        <ClayCard dark={isDark}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-5">
              <Text className={`text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>Today</Text>
              <Text className={`mt-2 text-3xl font-black ${isDark ? "text-white" : "text-ink"}`}>
                {formatCalories(remaining)} left
              </Text>
              <Text className={`mt-2 text-sm leading-5 ${isDark ? "text-white/60" : "text-cocoa"}`}>
                Goal {formatCalories(targets.calories)}
              </Text>
            </View>
            <CalorieRing achieved={totals.calories} goal={targets.calories} dark={isDark} />
          </View>

          <View className="mt-6 flex-row gap-3">
            <View className={`flex-1 rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
              <Text className={`text-xs font-bold ${isDark ? "text-white/55" : "text-cocoa"}`}>Achieved</Text>
              <Text className={`mt-2 text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>
                {formatCalories(totals.calories)}
              </Text>
            </View>
            <View className={`flex-1 rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
              <Text className={`text-xs font-bold ${isDark ? "text-white/55" : "text-cocoa"}`}>Water</Text>
              <Text className={`mt-2 text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>
                {waterAmountGlasses} / {waterGoalGlasses} cups
              </Text>
              <Text className={`mt-1 text-xs font-semibold ${isDark ? "text-white/55" : "text-cocoa"}`}>
                {waterAmountMl}ml logged, {waterRemainingMl}ml left
              </Text>
              <View className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-sage-100"}`}>
                <View className="h-2 rounded-full" style={{ width: waterProgressWidth, backgroundColor: colors.primary }} />
              </View>
              <View className="mt-3 flex-row items-center gap-2">
                <Pressable
                  onPress={() => setWaterGlasses((count) => Math.max(0, count - 1))}
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E4F0DB" }}
                >
                  <Ionicons name="remove" size={18} color={isDark ? "#FFFFFF" : colors.primaryDark} />
                </Pressable>
                <Pressable
                  onPress={() => setWaterGlasses((count) => count + 1)}
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  onPress={handleWaterSubmit}
                  className="h-9 flex-1 items-center justify-center rounded-full"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E4F0DB" }}
                >
                  <Text className={`text-xs font-black ${isDark ? "text-white" : "text-leaf-700"}`}>
                    Save {waterProgressPercent}%
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <View className="mb-5 flex-row items-center justify-between">
            <Text className={`text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>Macronutrients</Text>
            <Text className="text-xs font-extrabold text-leaf-600">See All</Text>
          </View>
          <MacroSummary totals={totals} targets={targets} dark={isDark} />
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <Text className={`mb-4 text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>Physical Activity</Text>
          <View className="gap-3">
            {dashboardTasks.map((task) => (
              <View
                key={task.id}
                className={`flex-row items-center rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-mint-100">
                  <Ionicons name={task.icon} size={20} color={colors.primaryDark} />
                </View>
                <Text className={`flex-1 font-bold ${isDark ? "text-white" : "text-ink"}`}>{task.label}</Text>
                <Ionicons
                  name={task.done ? "checkmark-circle" : "ellipse-outline"}
                  size={23}
                  color={task.done ? colors.primary : "#B7AEA2"}
                />
              </View>
            ))}
          </View>
        </ClayCard>
      </ScrollView>
    </View>
  );
}
