import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchMeals } from "../utils/meals";

import AppHeader from "../components/AppHeader";
import DateSelector from "../components/DateSelector";
import MealCard from "../components/MealCard";
import PrimaryButton from "../components/PrimaryButton";
import { useApp } from "../utils/appState";
import { getDateLabel, toApiDateString } from "../utils/formatters";

const mealSections = [
  { id: "breakfast", title: "Breakfast", accent: "#46A756" },
  { id: "lunch", title: "Lunch", accent: "#7DB7D9" },
  { id: "snacks", title: "Snacks", accent: "#F4B942" },
  { id: "dinner", title: "Dinner", accent: "#F28F7C" }
];

const parseApiDate = (value) => {
  if (!value || typeof value !== "string") return new Date();

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getMealEntries = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const formatAmount = (entry) => {
  const amount = Number(entry.amount || 0);
  return entry.amount_type === "grams" ? `${amount}g` : `${amount} serving`;
};

const toMealCards = (entries) =>
  mealSections.map((section) => ({
    ...section,
    foods: entries
      .filter((entry) => entry.meal_type === section.id)
      .map((entry) => ({
        id: entry.id,
        name: entry.food_name,
        calories: Number(entry.calories || 0),
        protein: Number(entry.protein || 0),
        carbs: Number(entry.carbs || 0),
        fat: Number(entry.fat || 0),
        amount: formatAmount(entry)
      }))
  }));

export default function MealScreen({ navigation, route }) {
  const { isDark } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [localMeals, setLocalMeals] = useState([]);
  const [loggedFoodCount, setLoggedFoodCount] = useState(0);

  useEffect(() => {
    if (route?.params?.selectedDate) {
      setSelectedDate(parseApiDate(route.params.selectedDate));
    }
  }, [route?.params?.selectedDate, route?.params?.refreshAt]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadMeals = async () => {
        try {
          const data = await fetchMeals(toApiDateString(selectedDate));
          const entries = getMealEntries(data);

          if (mounted) {
            setLoggedFoodCount(entries.length);
            setLocalMeals(toMealCards(entries));
          }
        } catch (error) {
          console.error("[MealScreen] fetchMeals:error", error);
        }
      };

      loadMeals();
      return () => {
        mounted = false;
      };
    }, [selectedDate, route?.params?.refreshAt])
  );

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title="Meals" subtitle={getDateLabel(selectedDate)} dark={isDark} />
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} dark={isDark} />

        <View className="mb-5 flex-row items-center justify-between">
          <Text className={`text-2xl font-black ${isDark ? "text-white" : "text-ink"}`}>Meal sections</Text>
          <Text className={`text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
            {loggedFoodCount} foods
          </Text>
        </View>

        {localMeals.map((meal) => (
          <MealCard key={meal.id} meal={meal} dark={isDark} />
        ))}

        <PrimaryButton
          title="Add Food"
          icon="add"
          onPress={() => navigation.navigate("AddFood", { selectedDate: toApiDateString(selectedDate) })}
        />
      </ScrollView>
    </View>
  );
}
