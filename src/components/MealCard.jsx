import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../constants/colors";
import { calculateMealTotals } from "../utils/calorieCalculator";
import { formatCalories, formatMacro } from "../utils/formatters";
import ClayCard from "./ClayCard";

export default function MealCard({ meal, dark = false, onDeleteFood, onEditFood }) {
  const totals = calculateMealTotals(meal.foods);

  return (
    <ClayCard className="mb-5" dark={dark}>
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-row items-center">
          <View
            className="mr-3 h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${meal.accent}22` }}
          >
            <Ionicons name="restaurant-outline" size={21} color={meal.accent || colors.primary} />
          </View>
          <View>
            <Text className={`text-lg font-extrabold ${dark ? "text-white" : "text-ink"}`}>
              {meal.title}
            </Text>
            <Text className={`mt-1 text-xs ${dark ? "text-white/60" : "text-cocoa"}`}>
              {meal.foods.length} logged foods
            </Text>
          </View>
        </View>
        <Text className="text-base font-extrabold text-leaf-600">{formatCalories(totals.calories)}</Text>
      </View>

      <View className="gap-3">
        {meal.foods.map((food) => (
          <View
            key={`${meal.id}-${food.id}-${food.name}`}
            className={`rounded-[22px] p-4 ${dark ? "bg-white/5" : "bg-sage-50"}`}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className={`font-bold ${dark ? "text-white" : "text-ink"}`}>{food.name}</Text>
                <Text className={`mt-1 text-xs ${dark ? "text-white/55" : "text-cocoa"}`}>{food.amount}</Text>
              </View>
              <Text className={`text-sm font-extrabold ${dark ? "text-white" : "text-ink"}`}>
                {food.calories} cal
              </Text>
            </View>
            <Text className={`mt-3 text-xs ${dark ? "text-white/55" : "text-cocoa"}`}>
              P {formatMacro(food.protein)} • C {formatMacro(food.carbs)} • F {formatMacro(food.fat)}
            </Text>
            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => onEditFood?.(food)}
                className="h-10 flex-1 flex-row items-center justify-center rounded-full"
                style={{ backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#E4F0DB" }}
              >
                <Ionicons name="pencil-outline" size={17} color={dark ? "#FFFFFF" : colors.primaryDark} />
                <Text className={`ml-2 text-xs font-black ${dark ? "text-white" : "text-leaf-700"}`}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => onDeleteFood?.(food)}
                className="h-10 flex-1 flex-row items-center justify-center rounded-full"
                style={{ backgroundColor: `${colors.coral}22` }}
              >
                <Ionicons name="trash-outline" size={17} color={colors.coral} />
                <Text className="ml-2 text-xs font-black" style={{ color: colors.coral }}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ClayCard>
  );
}
