import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../constants/colors";

const icons = {
  Home: ["home", "home-outline"],
  Meal: ["restaurant", "restaurant-outline"],
  AddFood: ["add", "add"],
  Progress: ["bar-chart", "bar-chart-outline"],
  Profile: ["person", "person-outline"]
};

export default function BottomTabIcon({ routeName, focused, size = 24 }) {
  const isAdd = routeName === "AddFood";
  const [activeIcon, inactiveIcon] = icons[routeName] || icons.Home;

  if (isAdd) {
    return (
      <View
        className="h-16 w-16 items-center justify-center rounded-full border-4 border-sage-50"
        style={{
          backgroundColor: colors.primary,
          shadowColor: "#2F6F39",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 16,
          elevation: 10
        }}
      >
        <Ionicons name="add" size={34} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View className="h-10 w-10 items-center justify-center rounded-2xl">
      <Ionicons name={focused ? activeIcon : inactiveIcon} size={size} color={focused ? colors.primary : "#9A9388"} />
    </View>
  );
}
