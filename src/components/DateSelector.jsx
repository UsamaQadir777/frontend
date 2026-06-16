import { Pressable, ScrollView, Text, View } from "react-native";

import colors from "../constants/colors";
import { formatDateKey, getShortDay } from "../utils/formatters";

const getMondayWeekDates = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;

  start.setDate(start.getDate() - daysFromMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + index);
    return nextDate;
  });
};

export default function DateSelector({ selectedDate, onChange, dark = false }) {
  const selectedKey = formatDateKey(selectedDate);
  const dates = getMondayWeekDates(selectedDate);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
      <View className="flex-row gap-3 pr-4">
        {dates.map((date) => {
          const key = formatDateKey(date);
          const isSelected = key === selectedKey;

          return (
            <Pressable
              key={key}
              onPress={() => onChange(date)}
              className="h-[72px] w-[58px] items-center justify-center rounded-[24px] border"
              style={{
                backgroundColor: isSelected ? colors.primary : dark ? colors.cardDark : colors.card,
                borderColor: isSelected ? colors.primary : dark ? "rgba(255,255,255,0.1)" : "#FFFFFF",
                shadowColor: "#6C836A",
                shadowOffset: { width: 4, height: 8 },
                shadowOpacity: isSelected ? 0.22 : 0.1,
                shadowRadius: 14,
                elevation: isSelected ? 5 : 2
              }}
            >
              <Text className={`text-xs font-bold ${isSelected ? "text-white" : dark ? "text-white/60" : "text-cocoa"}`}>
                {getShortDay(date)}
              </Text>
              <Text className={`mt-2 text-lg font-extrabold ${isSelected ? "text-white" : dark ? "text-white" : "text-ink"}`}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
