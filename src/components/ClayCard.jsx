import { View } from "react-native";

import colors from "../constants/colors";

export default function ClayCard({ children, className = "", style, dark = false }) {
  return (
    <View
      className={`rounded-[28px] border p-5 ${dark ? "border-white/10" : "border-white/80"} ${className}`}
      style={[
        {
          backgroundColor: dark ? colors.cardDark : colors.card,
          shadowColor: "#5D755F",
          shadowOffset: { width: 8, height: 12 },
          shadowOpacity: dark ? 0.12 : 0.16,
          shadowRadius: 22,
          elevation: 7
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
