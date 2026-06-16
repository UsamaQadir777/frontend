import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
import { calculateDayTotals } from "../utils/calorieCalculator";
import { formatCalories, toApiDateString } from "../utils/formatters";

const taskIcons = {
  water: "water-outline",
  breakfast: "sunny-outline",
  all_meals: "restaurant-outline"
};

const getGreetingForHour = (hour) => {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
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
  const [waterAmountInput, setWaterAmountInput] = useState("");
  const [waterSummary, setWaterSummary] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  const loadDashboard = useCallback(async () => {
    const data = await fetchDashboard(toApiDateString(selectedDate));
    const nextWaterSummary = data?.water ?? (data?.amount_ml !== undefined ? data : null);

    setDashboardSummary(data);

    if (nextWaterSummary) {
      setWaterSummary(nextWaterSummary);
    }
  }, [selectedDate]);

  const handleWaterSubmit = async () => {
    const entryGlasses = Math.max(0, Math.round(Number(waterAmountInput) || 0));
    const entryAmountMl = entryGlasses * 250;
    const currentAmountMl = Math.max(0, Math.round(Number(waterSummary?.amount_ml) || 0));
    const nextTotalAmountMl = currentAmountMl + entryAmountMl;

    try {
      const res = await updateWater(toApiDateString(selectedDate), nextTotalAmountMl);
      const nextWaterSummary = res?.water ?? res;
      const savedAmountMl = Number(nextWaterSummary?.amount_ml ?? nextTotalAmountMl);
      const savedGlasses = Math.round(savedAmountMl / 250);

      setWaterSummary(nextWaterSummary);
      setWaterAmountInput("");
      loadDashboard().catch((error) => {
        console.error("[HomeScreen] waterDashboardRefresh:error", error);
      });
      Alert.alert("Water intake updated", `${entryGlasses} glasses added. Total: ${savedGlasses} glasses`);
    } catch (error) {
      Alert.alert("Water update failed", "Please try again.");
    }
  };

  const handleWaterAmountChange = (text) => {
    setWaterAmountInput(text.replace(/[^0-9]/g, ""));
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
  const consumedCalories = Number(totals.calories) || 0;
  const goalCalories = Number(targets.calories) || 0;
  const overCalorieGoal = consumedCalories >= goalCalories;
  const calorieDifference = Math.round(Math.abs(goalCalories - consumedCalories)).toLocaleString();
  const calorieStatusText = overCalorieGoal ? `+${calorieDifference} kcal over` : `${calorieDifference} kcal left`;
  const calorieStatusColor = overCalorieGoal ? "text-red-500" : isDark ? "text-white" : "text-ink";
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
  const waterGlasses = Math.round((Number(waterSummary?.amount_ml) || 0) / 250);
  const waterGoalGlasses = 8;
  const waterProgressPercent = Math.max(0, Math.min(100, Math.round(Number(waterSummary?.progress_percent) || 0)));
  const waterProgressWidth = `${Math.max(0, Math.min(100, waterProgressPercent))}%`;
  const greeting = getGreetingForHour(new Date().getHours());

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title={`${greeting}, ${profile.name}`} dark={isDark} />
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} dark={isDark} />

        <ClayCard dark={isDark}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-5">
              <Text className={`text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>Today</Text>
              <Text className={`mt-2 text-3xl font-black ${calorieStatusColor}`}>{calorieStatusText}</Text>
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
                {waterGlasses} / {waterGoalGlasses} glasses
              </Text>
              <TextInput
                value={waterAmountInput}
                onChangeText={handleWaterAmountChange}
                keyboardType="number-pad"
                className={`mt-3 h-11 rounded-[18px] px-4 text-base font-bold ${isDark ? "bg-white/5 text-white" : "bg-white text-ink"}`}
                placeholder="Glasses"
                placeholderTextColor="#A09689"
              />
              <View className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-sage-100"}`}>
                <View className="h-2 rounded-full" style={{ width: waterProgressWidth, backgroundColor: colors.primary }} />
              </View>
              <View className="mt-3 flex-row items-center gap-2">
                <Pressable
                  onPress={handleWaterSubmit}
                  className="h-9 flex-1 items-center justify-center rounded-full"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E4F0DB" }}
                >
                  <Text className={`text-xs font-black ${isDark ? "text-white" : "text-leaf-700"}`}>Add</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <View className="mb-5 flex-row items-center justify-between">
            <Text className={`text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>Key nutrients</Text>
  
          </View>
          <MacroSummary totals={totals} targets={targets} dark={isDark} />
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <Text className={`mb-4 text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>Your Reminders</Text>
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
