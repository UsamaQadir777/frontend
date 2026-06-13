import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../constants/colors";
import { formatCalories, formatMacro } from "../utils/formatters";

export default function FoodCard({ food, onPress, selected = false, dark = false }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-[24px] border p-4 active:scale-[0.99]"
      style={{
        backgroundColor: selected ? colors.secondary : dark ? colors.cardDark : colors.card,
        borderColor: selected ? colors.primary : dark ? "rgba(255,255,255,0.1)" : "#FFFFFF",
        shadowColor: "#5D755F",
        shadowOffset: { width: 5, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 3
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className={`text-base font-extrabold ${dark ? "text-white" : "text-ink"}`}>{food.name}</Text>
          {/* <Text className={`mt-1 text-xs ${dark ? "text-white/55" : "text-cocoa"}`}>{food.serving}</Text> */}
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-mint-100">
          <Ionicons name={selected ? "checkmark" : "add"} size={20} color={colors.primaryDark} />
        </View>
      </View>
      {/* <Text className={`mt-3 text-xs ${dark ? "text-white/60" : "text-cocoa"}`}>
        {formatCalories(food.calories)} • P {formatMacro(food.protein)} • C {formatMacro(food.carbs)} • F{" "}
        {formatMacro(food.fat)}
      </Text> */}
    </Pressable>
  );
}
