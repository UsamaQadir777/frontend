import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import colors from "../constants/colors";

export default function PrimaryButton({
  title,
  onPress,
  icon,
  variant = "primary",
  className = "",
  disabled = false
}) {
  const isGhost = variant === "ghost";
  const isSoft = variant === "soft";

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={`h-14 flex-row items-center justify-center rounded-full px-6 active:scale-[0.98] ${className}`}
      style={{
        backgroundColor: disabled
          ? "#BFCDBD"
          : isGhost
            ? "transparent"
            : isSoft
              ? colors.secondary
              : colors.primary,
        borderWidth: isGhost ? 1 : 0,
        borderColor: colors.border,
        shadowColor: isGhost ? "transparent" : "#3A7F45",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isGhost ? 0 : 0.22,
        shadowRadius: 18,
        elevation: isGhost ? 0 : 5,
        opacity: disabled ? 0.7 : 1
      }}
    >
      {icon ? (
        <View className="mr-2">
          <Ionicons name={icon} size={20} color={isGhost || isSoft ? colors.primaryDark : "#FFFFFF"} />
        </View>
      ) : null}
      <Text
        className="text-base font-bold"
        style={{ color: isGhost || isSoft ? colors.primaryDark : "#FFFFFF" }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
