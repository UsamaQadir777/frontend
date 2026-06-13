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

const macroColors = [
  { key: "protein", label: "Protein", color: colors.protein, caloriesPerGram: 4 },
  { key: "carbs", label: "Carbs", color: colors.carbs, caloriesPerGram: 4 },
  { key: "fat", label: "Fat", color: colors.fat, caloriesPerGram: 9 }
];

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

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const end = toApiDateString(selectedDate);
      const startDate = new Date(selectedDate);
      startDate.setDate(selectedDate.getDate() - 6);
      const start = toApiDateString(startDate);

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
                fat: Number(entry.fat || 0),
                weightKg: profile.weightKg
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
    }, [profile.weightKg, selectedDate])
  );

  const selectedKey = formatDateKey(selectedDate);
  const selectedProgress = useMemo(
    () => progressEntries.find((entry) => entry.date === selectedKey) || progressEntries[progressEntries.length - 1],
    [progressEntries, selectedKey]
  );
  const maxCalories = Math.max(...progressEntries.map((entry) => entry.calories), profile.targets.calories);

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title="Progress" subtitle="Calories, macros, and weight" dark={isDark} />
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
              Goal {formatCalories(profile.targets.calories)}
            </Text>
          </View>
          <View className="h-48 flex-row items-end justify-between">
            {progressEntries.map((entry) => {
              const height = Math.max(26, (entry.calories / maxCalories) * 170);
              const isSelected = entry.date === selectedProgress.date;
              return (
                <View key={entry.date} className="items-center">
                  <View
                    className="w-8 rounded-full"
                    style={{
                      height,
                      backgroundColor: isSelected ? colors.primary : "#CFE4C3"
                    }}
                  />
                  <Text className={`mt-3 text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
                    {new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                </View>
              );
            })}
          </View>
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <Text className={`mb-4 text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>Weight trend</Text>
          <View className="flex-row items-end justify-between">
            {progressEntries.map((entry) => (
              <View key={entry.date} className="items-center">
                <Text className={`mb-2 text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
                  {entry.weightKg}
                </Text>
                <View className="h-3 w-3 rounded-full bg-leaf-500" />
              </View>
            ))}
          </View>
        </ClayCard>
      </ScrollView>
    </View>
  );
}
