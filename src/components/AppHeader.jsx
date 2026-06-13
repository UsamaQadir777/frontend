import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../constants/colors";

export default function AppHeader({ title = "Calorie Counter", subtitle, dark = false }) {
  return (
    <View className="mb-5 flex-row items-center justify-between px-1">
      <View className="h-12 w-12 items-center justify-center rounded-3xl bg-mint-100">
        <Ionicons name="leaf" size={24} color={colors.primaryDark} />
      </View>
      <View className="flex-1 px-4">
        <Text className={`text-center text-xl font-extrabold ${dark ? "text-white" : "text-ink"}`}>
          {title}
        </Text>
        {subtitle ? (
          <Text className={`mt-1 text-center text-xs ${dark ? "text-white/60" : "text-cocoa"}`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="h-12 w-12 items-center justify-center rounded-3xl bg-clay-100">
        <Ionicons name="sparkles-outline" size={23} color={colors.primary} />
      </View>
    </View>
  );
}
