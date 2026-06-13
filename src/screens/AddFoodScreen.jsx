import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppHeader from "../components/AppHeader";
import ClayCard from "../components/ClayCard";
import FoodCard from "../components/FoodCard";
import PrimaryButton from "../components/PrimaryButton";
import colors from "../constants/colors";
import { useApp } from "../utils/appState";
import { scaleNutrition } from "../utils/calorieCalculator";
import { formatCalories, formatMacro, toApiDateString } from "../utils/formatters";
import { addMeal, fetchFoods } from "../utils/meals";

const mealOptions = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "snacks", label: "Snacks" },
  { id: "dinner", label: "Dinner" }
];

const toFoodNumber = (value) => Number(value || 0);
const FOOD_LOAD_TIMEOUT_MS = 10000;

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);

export default function AddFoodScreen({ navigation, route }) {
  console.log("[AddFoodScreen] render");

  const { isDark } = useApp();
  const mountedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState("100");
  const [amountMode, setAmountMode] = useState("grams");
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [foodLoadError, setFoodLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const logDate = toApiDateString(route?.params?.selectedDate || new Date());

  const selectFood = (food) => {
    setSelectedFood(food);
    const nextMode = food?.serving_type === "quantity" ? "quantity" : "grams";
    setAmountMode(nextMode);
    setAmount(nextMode === "quantity" ? "1" : "100");
  };

  const loadFoods = async () => {
    console.log("[AddFoodScreen] fetchFoods:start");
    setLoadingFoods(true);
    setFoodLoadError("");
    try {
      const data = await withTimeout(
        fetchFoods(),
        FOOD_LOAD_TIMEOUT_MS,
        "Food list request timed out. Please check your connection and try again."
      );
      const nextFoods = data.map((food) => ({
        ...food,
        id: Number(food.id),
        category: food.category,
        calories: toFoodNumber(food.calories),
        protein: toFoodNumber(food.protein),
        carbs: toFoodNumber(food.carbs),
        fat: toFoodNumber(food.fat)
      }));

      if (!mountedRef.current) return;
      setFoods(nextFoods);
      if (nextFoods.length > 0) {
        selectFood(nextFoods[0]);
      }
      console.log(`[AddFoodScreen] fetchFoods:success count=${nextFoods.length}`);
    } catch (error) {
      if (!mountedRef.current) return;
      const message = error.message || "Please try again.";
      console.error("[AddFoodScreen] fetchFoods:error", error);
      setFoods([]);
      setSelectedFood(null);
      setFoodLoadError(message);
      Alert.alert("Could not load foods", message);
    } finally {
      if (!mountedRef.current) return;
      setLoadingFoods(false);
      console.log("[AddFoodScreen] fetchFoods:finished");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    console.log("[AddFoodScreen] mounted");
    loadFoods();
    return () => {
      mountedRef.current = false;
      console.log("[AddFoodScreen] unmounted");
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = new Map();
    foods.forEach((food) => {
      if (!categories.has(food.category)) {
        categories.set(food.category, {
          id: food.category,
          name: food.category_name || "Other",
          icon: "restaurant-outline"
        });
      }
    });

    return [{ id: "all", name: "All", icon: "apps-outline" }, ...categories.values()];
  }, [foods]);

  const visibleFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesCategory = activeCategory === "all" || String(food.category) === String(activeCategory);
      const matchesQuery = !normalizedQuery || food.name.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, foods, query]);

  const nutrition = selectedFood ? scaleNutrition(selectedFood, amount, amountMode) : null;

  const handleAddFood = async () => {
    if (saving) return;

    if (!selectedFood) {
      Alert.alert("Select a food", "Choose a food item before adding it to a meal.");
      return;
    }

    const foodId = Number(selectedFood.id);
    if (!Number.isInteger(foodId) || foodId <= 0) {
      Alert.alert("Invalid food", "Please select a food item from the food list.");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Enter an amount", "Amount must be greater than zero.");
      return;
    }

    const payload = {
      food: foodId,
      meal_type: selectedMeal,
      date: logDate,
      amount: numericAmount,
      amount_type: amountMode
    };

    setSaving(true);
    try {
      await addMeal(payload);
      Alert.alert("Food added", `${selectedFood.name} was added to ${selectedMeal}.`, [
        {
          text: "OK",
          onPress: () => navigation.navigate("Meal", { selectedDate: logDate, refreshAt: Date.now() })
        }
      ]);
    } catch (error) {
      Alert.alert("Could not add food", error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title="Add Food" subtitle="Search and log nutrition" dark={isDark} />

        <View
          className={`mb-5 flex-row items-center rounded-[26px] border px-5 ${isDark ? "border-white/10 bg-white/5" : "border-white bg-clay-50"}`}
          style={{
            shadowColor: "#6F846A",
            shadowOffset: { width: 5, height: 9 },
            shadowOpacity: 0.1,
            shadowRadius: 14,
            elevation: 3
          }}
        >
          <Ionicons name="search-outline" size={20} color={isDark ? "#FFFFFF" : colors.primaryDark} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search food"
            placeholderTextColor="#A09689"
            className={`ml-3 h-14 flex-1 text-base ${isDark ? "text-white" : "text-ink"}`}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          <View className="flex-row gap-3 pr-4">
            {categoryOptions.map((category) => {
              const selected = category.id === activeCategory && !query.trim();
              return (
                <Pressable
                  key={category.id}
                  onPress={() => {
                    setActiveCategory(category.id);
                    setQuery("");
                  }}
                  className="h-12 flex-row items-center rounded-full px-4"
                  style={{ backgroundColor: selected ? colors.primary : isDark ? colors.cardDark : colors.card }}
                >
                  <Ionicons name={category.icon} size={18} color={selected ? "#FFFFFF" : colors.primaryDark} />
                  <Text className={`ml-2 font-bold ${selected ? "text-white" : isDark ? "text-white" : "text-ink"}`}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="mb-5">
          {loadingFoods ? (
            <Text className={`text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Loading foods...</Text>
          ) : null}
          {!loadingFoods && visibleFoods.length === 0 ? (
            <View className="gap-3">
              <Text className={`text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>
                {foodLoadError || "No foods found."}
              </Text>
              {foodLoadError ? (
                <Pressable
                  onPress={loadFoods}
                  className="h-11 items-center justify-center rounded-full px-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="font-bold text-white">Retry</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {visibleFoods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              selected={selectedFood?.id === food.id}
              onPress={() => selectFood(food)}
              dark={isDark}
            />
          ))}
        </View>

        {selectedFood ? (
          <ClayCard dark={isDark}>
            <Text className={`text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>{selectedFood.name}</Text>

            <View className="mt-5 flex-row gap-3">
              {[
                ["grams", "Grams"],
                ["quantity", "Qty"]
              ].map(([value, label]) => {
                const selected = amountMode === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setAmountMode(value)}
                    className="flex-1 items-center rounded-full py-3"
                    style={{ backgroundColor: selected ? colors.primary : isDark ? "rgba(255,255,255,0.06)" : "#F3F8EF" }}
                  >
                    <Text className={`font-bold ${selected ? "text-white" : isDark ? "text-white" : "text-ink"}`}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              className={`mt-4 h-14 rounded-[24px] px-5 text-lg font-bold ${isDark ? "bg-white/5 text-white" : "bg-sage-50 text-ink"}`}
              placeholder={amountMode === "grams" ? "100" : "1"}
              placeholderTextColor="#A09689"
            />

            {nutrition ? (
              <View className="mt-5 gap-3">
                <View className={`rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
                  <Text className={`text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>Calories</Text>
                  <Text className={`mt-1 text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>
                    {formatCalories(nutrition.calories)}
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <View className={`flex-1 rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
                    <Text className={`text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>Protein</Text>
                    <Text className={`mt-1 text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>
                      {formatMacro(nutrition.protein)}
                    </Text>
                  </View>
                  <View className={`flex-1 rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
                    <Text className={`text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>Carbs</Text>
                    <Text className={`mt-1 text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>
                      {formatMacro(nutrition.carbs)}
                    </Text>
                  </View>
                  <View className={`flex-1 rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
                    <Text className={`text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>Fat</Text>
                    <Text className={`mt-1 text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>
                      {formatMacro(nutrition.fat)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <Text className={`mt-6 mb-3 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Add to</Text>
            <View className="flex-row flex-wrap gap-3">
              {mealOptions.map((meal) => {
                const selected = selectedMeal === meal.id;
                return (
                  <Pressable
                    key={meal.id}
                    onPress={() => setSelectedMeal(meal.id)}
                    className="rounded-full px-4 py-3"
                    style={{ backgroundColor: selected ? colors.primary : isDark ? "rgba(255,255,255,0.06)" : "#F3F8EF" }}
                  >
                    <Text className={`font-bold ${selected ? "text-white" : isDark ? "text-white" : "text-ink"}`}>
                      {meal.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <PrimaryButton
              title={saving ? "Adding..." : "Add Food"}
              icon="checkmark"
              onPress={handleAddFood}
              className="mt-6"
              disabled={saving || loadingFoods}
            />
          </ClayCard>
        ) : null}
      </ScrollView>
    </View>
  );
}
