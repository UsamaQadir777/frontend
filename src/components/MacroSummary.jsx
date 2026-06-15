import { Text, View } from "react-native";

import colors from "../constants/colors";
import { formatMacro, formatPercent } from "../utils/formatters";

const macroRows = [
  { key: "protein", label: "Protein", color: colors.protein },
  { key: "carbs", label: "Carbs", color: colors.carbs },
  { key: "fat", label: "Fat", color: colors.fat }
];

export default function MacroSummary({ totals, targets, compact = false, dark = false }) {
  return (
    <View className={compact ? "gap-3" : "gap-4"}>
      {macroRows.map((macro) => {
        const value = totals?.[macro.key] ?? 0;
        const target = targets?.[macro.key] ?? 1;
        const width = formatPercent(value, target);
        const barColor = Number(value) > Number(target) ? colors.coral : macro.color;

        return (
          <View key={macro.key}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className={`text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>
                {macro.label}
              </Text>
              <Text className={`text-xs font-semibold ${dark ? "text-white/60" : "text-cocoa"}`}>
                {formatMacro(value)} / {formatMacro(target)}
              </Text>
            </View>
            <View className={`h-3 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-sage-100"}`}>
              <View className="h-3 rounded-full" style={{ width, backgroundColor: barColor }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
