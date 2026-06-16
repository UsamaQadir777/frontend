import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { deleteMeal, fetchMeals } from "../utils/meals";

import AppHeader from "../components/AppHeader";
import DateSelector from "../components/DateSelector";
import MealCard from "../components/MealCard";
import { useApp } from "../utils/appState";
import { toApiDateString } from "../utils/formatters";

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

const getEntryFoodId = (entry) => {
  if (entry.food_id) return Number(entry.food_id);
  if (typeof entry.food === "number") return entry.food;
  if (entry.food?.id) return Number(entry.food.id);
  return null;
};

const getEntryId = (entry) => {
  const id = entry.id ?? entry.pk ?? entry.meal_id;
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
};

const toMealCards = (entries) =>
  mealSections.map((section) => ({
    ...section,
    foods: entries
      .filter((entry) => entry.meal_type === section.id)
      .map((entry) => ({
        id: getEntryId(entry),
        name: entry.food_name,
        calories: Number(entry.calories || 0),
        protein: Number(entry.protein || 0),
        carbs: Number(entry.carbs || 0),
        fat: Number(entry.fat || 0),
        amount: formatAmount(entry),
        amountValue: Number(entry.amount || 0),
        amountType: entry.amount_type || "grams",
        date: entry.date,
        foodId: getEntryFoodId(entry),
        foodName: entry.food_name || entry.food?.name,
        mealType: entry.meal_type,
        rawEntry: entry
      }))
  }));

export default function MealScreen({ navigation, route }) {
  const { isDark, requestDashboardRefresh } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [localMeals, setLocalMeals] = useState([]);
  const [loggedFoodCount, setLoggedFoodCount] = useState(0);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [deletingMeal, setDeletingMeal] = useState(false);

  const loadMeals = useCallback(async () => {
    try {
      const data = await fetchMeals(toApiDateString(selectedDate));
      const entries = getMealEntries(data);

      setLoggedFoodCount(entries.length);
      setLocalMeals(toMealCards(entries));
    } catch (error) {
      console.error("[MealScreen] fetchMeals:error", error);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (route?.params?.selectedDate) {
      setSelectedDate(parseApiDate(route.params.selectedDate));
    }
  }, [route?.params?.selectedDate, route?.params?.refreshAt]);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [loadMeals, route?.params?.refreshAt])
  );

  const handleDeleteMeal = (food) => {
    const numericMealId = Number(food?.id);
    if (!Number.isInteger(numericMealId) || numericMealId <= 0) {
      Alert.alert("Could not delete meal", "This meal entry is missing a valid backend id.");
      return;
    }

    setMealToDelete({ ...food, id: numericMealId });
  };

  const confirmDeleteMeal = async () => {
    if (!mealToDelete || deletingMeal) return;

    setDeletingMeal(true);
    try {
      await deleteMeal(mealToDelete.id);
      setLocalMeals((currentMeals) =>
        currentMeals.map((meal) => ({
          ...meal,
          foods: meal.foods.filter((entry) => entry.id !== mealToDelete.id)
        }))
      );
      setLoggedFoodCount((count) => Math.max(0, count - 1));
      setMealToDelete(null);
      requestDashboardRefresh?.();
      await loadMeals();
    } catch (error) {
      Alert.alert("Could not delete meal", error.message || "Please try again.");
    } finally {
      setDeletingMeal(false);
    }
  };

  const handleEditMeal = (food) => {
    navigation.navigate("AddFood", {
      mode: "edit",
      selectedDate: food.date || toApiDateString(selectedDate),
      mealEntry: food
    });
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title="Meals" dark={isDark} />
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} dark={isDark} />

        <View className="mb-5 flex-row items-center justify-between">
          <Text className={`text-2xl font-black ${isDark ? "text-white" : "text-ink"}`}>Meal sections</Text>
          <Text className={`text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
            {loggedFoodCount} foods
          </Text>
        </View>

        {localMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            dark={isDark}
            onDeleteFood={handleDeleteMeal}
            onEditFood={handleEditMeal}
          />
        ))}

      </ScrollView>
      <Modal
        transparent
        visible={Boolean(mealToDelete)}
        animationType="fade"
        onRequestClose={() => setMealToDelete(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className={`w-full rounded-[26px] p-5 ${isDark ? "bg-sage-900" : "bg-clay-50"}`}>
            <Text className={`text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>Delete meal?</Text>
            <Text className={`mt-2 text-sm leading-5 ${isDark ? "text-white/70" : "text-cocoa"}`}>
              Are you sure you want to delete this meal?
            </Text>
            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => setMealToDelete(null)}
                disabled={deletingMeal}
                className="h-12 flex-1 items-center justify-center rounded-full"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E4F0DB" }}
              >
                <Text className={`font-black ${isDark ? "text-white" : "text-leaf-700"}`}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteMeal}
                disabled={deletingMeal}
                className="h-12 flex-1 items-center justify-center rounded-full"
                style={{ backgroundColor: "#E53935", opacity: deletingMeal ? 0.7 : 1 }}
              >
                <Text className="font-black text-white">{deletingMeal ? "Deleting..." : "Delete"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
