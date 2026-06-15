import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";

import AppHeader from "../components/AppHeader";
import ClayCard from "../components/ClayCard";
import DateSelector from "../components/DateSelector";
import colors from "../constants/colors";
import { dummyProgress } from "../data/dummyProgress";
import { useApp } from "../utils/appState";
import { fetchProgress } from "../utils/meals";
import { formatCalories, formatDateKey, formatMacro, toApiDateString } from "../utils/formatters";

const underGoalColor = "#F5C542";
const withinGoalColor = "#4CAF50";
const exceededGoalColor = "#E53935";

const macroColors = [
  { key: "protein", label: "Protein", color: colors.protein, caloriesPerGram: 4 },
  { key: "carbs", label: "Carbs", color: colors.carbs, caloriesPerGram: 4 },
  { key: "fat", label: "Fat", color: colors.fat, caloriesPerGram: 9 }
];

const getWeekStart = (date) => {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + mondayOffset);
  return nextDate;
};

const createWeekDays = (weekStart) =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

const getEntryKey = (entry) => toApiDateString(entry.date);

const getBarColor = (calories, goal) => {
  if (!goal || calories < goal * 0.5) return underGoalColor;
  if (calories <= goal) return withinGoalColor;
  return exceededGoalColor;
};

function MacroDonut({ progress, dark = false }) {
  const size = 178;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const totalMacroCalories = macroColors.reduce(
    (sum, macro) => sum + progress[macro.key] * macro.caloriesPerGram,
    0
  );
  let offset = 0;

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
        {macroColors.map((macro) => {
          const segment = totalMacroCalories ? (progress[macro.key] * macro.caloriesPerGram) / totalMacroCalories : 0;
          const dash = segment * circumference;
          const circle = (
            <Circle
              key={macro.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={macro.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              fill="transparent"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          );
          offset += dash;
          return circle;
        })}
      </Svg>
      <View className="absolute items-center">
        <Text className={`text-3xl font-black ${dark ? "text-white" : "text-ink"}`}>{Math.round(progress.calories)}</Text>
        <Text className={`text-xs font-bold ${dark ? "text-white/60" : "text-cocoa"}`}>calories</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { profile, isDark } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [progressEntries, setProgressEntries] = useState(dummyProgress);
  const dailyCalorieGoal = Number(profile.daily_calorie_goal ?? profile.dailyCalorieGoal ?? profile.targets.calories) || 0;
  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => createWeekDays(weekStart), [weekStart]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const start = toApiDateString(weekDays[0]);
      const end = toApiDateString(weekDays[6]);

      const loadProgress = async () => {
        try {
          const data = await fetchProgress({ start, end });
          const nextEntries = Array.isArray(data?.weekly_progress) ? data.weekly_progress : data?.daily || [];

          if (mounted && nextEntries.length > 0) {
            setProgressEntries(
              nextEntries.map((entry) => ({
                date: toApiDateString(entry.date),
                calories: Number(entry.calories || 0),
                protein: Number(entry.protein || 0),
                carbs: Number(entry.carbs || 0),
                fat: Number(entry.fat || 0)
              }))
            );
          }
        } catch (error) {
          console.error("[ProgressScreen] fetchProgress:error", error);
        }
      };

      loadProgress();
      return () => {
        mounted = false;
      };
    }, [weekDays])
  );

  const selectedKey = formatDateKey(selectedDate);
  const selectedProgress = useMemo(
    () => progressEntries.find((entry) => entry.date === selectedKey) || progressEntries[progressEntries.length - 1],
    [progressEntries, selectedKey]
  );
  const weeklyProgress = useMemo(() => {
    const entriesByDate = new Map(progressEntries.map((entry) => [getEntryKey(entry), entry]));

    return weekDays.map((date) => {
      const key = toApiDateString(date);
      const entry = entriesByDate.get(key);

      return {
        date: key,
        calories: Number(entry?.calories || 0),
        protein: Number(entry?.protein || 0),
        carbs: Number(entry?.carbs || 0),
        fat: Number(entry?.fat || 0)
      };
    });
  }, [progressEntries, weekDays]);

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title="Progress" subtitle="Calories and macros" dark={isDark} />
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} dark={isDark} />

        <ClayCard dark={isDark}>
          <View className="items-center">
            <MacroDonut progress={selectedProgress} dark={isDark} />
          </View>
          <View className="mt-6 gap-3">
            {macroColors.map((macro) => (
              <View
                key={macro.key}
                className={`flex-row items-center justify-between rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}
              >
                <View className="flex-row items-center">
                  <View className="mr-3 h-3 w-3 rounded-full" style={{ backgroundColor: macro.color }} />
                  <Text className={`font-bold ${isDark ? "text-white" : "text-ink"}`}>{macro.label}</Text>
                </View>
                <Text className={`font-extrabold ${isDark ? "text-white" : "text-ink"}`}>
                  {formatMacro(selectedProgress[macro.key])}
                </Text>
              </View>
            ))}
          </View>
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <View className="mb-6 flex-row items-center justify-between">
            <Text className={`text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>One week</Text>
            <Text className={`text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
              Goal: {formatCalories(dailyCalorieGoal)}
            </Text>
          </View>
          <View className="h-56 flex-row items-end justify-between">
            {weeklyProgress.map((entry) => {
              const calories = Math.round(entry.calories);
              const ratio = dailyCalorieGoal ? entry.calories / dailyCalorieGoal : 0;
              const height = Math.max(entry.calories > 0 ? 24 : 8, Math.min(ratio, 1.2) * 142);
              const barColor = getBarColor(entry.calories, dailyCalorieGoal);

              return (
                <View key={entry.date} className="flex-1 items-center">
                  <Text className={`mb-2 text-xs font-black ${isDark ? "text-white" : "text-ink"}`}>
                    {calories}
                  </Text>
                  <View
                    className="w-8 rounded-t-2xl"
                    style={{
                      height,
                      backgroundColor: barColor
                    }}
                  />
                  <Text className={`mt-3 text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
                    {new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                </View>
              );
            })}
          </View>
          <View className="mt-5 gap-2">
            {[
              ["🟡", "Yellow = Under goal"],
              ["🟢", "Green = Within goal"],
              ["🔴", "Red = Exceeded goal"]
            ].map(([icon, label]) => (
              <View key={label} className="flex-row items-center">
                <Text className="mr-2 text-base">{icon}</Text>
                <Text className={`text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>{label}</Text>
              </View>
            ))}
          </View>
        </ClayCard>
      </ScrollView>
    </View>
  );
}
