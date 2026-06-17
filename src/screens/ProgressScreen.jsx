import React, { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Line, Path, Rect, Stop, Text as SvgText } from "react-native-svg";

import AppHeader from "../components/AppHeader";
import ClayCard from "../components/ClayCard";
import DateSelector from "../components/DateSelector";
import colors from "../constants/colors";
import { dummyProgress } from "../data/dummyProgress";
import { useApp } from "../utils/appState";
import { fetchProgress } from "../utils/meals";
import { formatCalories, formatDateKey, formatMacro, toApiDateString } from "../utils/formatters";

const macroColors = [
  { key: "protein", label: "Protein", color: colors.protein, caloriesPerGram: 4 },
  { key: "carbs", label: "Carbs", color: colors.carbs, caloriesPerGram: 4 },
  { key: "fat", label: "Fat", color: colors.fat, caloriesPerGram: 9 }
];

const chartRanges = [
  { key: "last7", label: "7 days" },
  { key: "last30", label: "30 days" },
  { key: "year", label: "This year" }
];

const DAY_MS = 86400000;
const UNDER_GOAL_COLOR = "#639922";
const OVER_GOAL_COLOR = "#E24B4A";

const getEntryKey = (entry) => toApiDateString(entry.date);

const normalizeProgressEntry = (entry) => ({
  date: toApiDateString(entry.date),
  calories: Number(entry.calories || 0),
  protein: Number(entry.protein || 0),
  carbs: Number(entry.carbs || 0),
  fat: Number(entry.fat || 0)
});

const createDateAtNoon = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
};

const addDays = (date, days) => {
  const nextDate = createDateAtNoon(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const parseDateKey = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;

  const date = createDateAtNoon(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) || toApiDateString(date) !== value ? null : date;
};

const getRangeLength = (start, end) => Math.max(1, Math.round((createDateAtNoon(end) - createDateAtNoon(start)) / DAY_MS) + 1);

const getDateRangeLabel = (start, end) => {
  const startDate = createDateAtNoon(start);
  const endDate = createDateAtNoon(end);
  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
  const startLabel = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = endDate.toLocaleDateString("en-US", sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });

  return `${startLabel} - ${endLabel}`;
};

const getDailyChartLabel = (date, rangeLength) => {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return rangeLength >= 7 ? weekday : `${weekday} ${date.getDate()}`;
};

const createDateRange = (start, end) => {
  const rangeStart = createDateAtNoon(start);
  const rangeEnd = createDateAtNoon(end);
  const dayCount = Math.max(1, Math.round((rangeEnd - rangeStart) / DAY_MS) + 1);

  return Array.from({ length: dayCount }, (_, index) => addDays(rangeStart, index));
};

const getYearStart = (date) => new Date(date.getFullYear(), 0, 1, 12);

const getRangeDates = (range, periodOffsets, sevenDayRange) => {
  const today = createDateAtNoon(new Date());

  if (range === "last30") {
    const end = addDays(today, (periodOffsets.last30 || 0) * 30);
    return { start: addDays(end, -29), end };
  }

  if (range === "year") {
    return { start: getYearStart(today), end: today };
  }

  return {
    start: createDateAtNoon(sevenDayRange.start),
    end: createDateAtNoon(sevenDayRange.end)
  };
};

const getMonthLabel = (date) => date.toLocaleDateString("en-US", { month: "short" });

const sumCalories = (entries) => entries.reduce((total, entry) => total + Number(entry.calories || 0), 0);

const getAverageCalories = (entries, fallbackDays = 1) => {
  const daysWithEntries = new Set(entries.map((entry) => entry.date)).size;
  const dayCount = Math.max(daysWithEntries || fallbackDays, 1);
  return sumCalories(entries) / dayCount;
};

const buildDailyChartData = (range, start, end, progressEntries) => {
  const entriesByDate = new Map(progressEntries.map((entry) => [getEntryKey(entry), entry]));
  const rangeLength = getRangeLength(start, end);

  return createDateRange(start, end).map((date) => {
    const key = toApiDateString(date);
    const entry = entriesByDate.get(key);

    return {
      key,
      label: getDailyChartLabel(date, rangeLength),
      calories: Number(entry?.calories || 0)
    };
  });
};

const buildWeeklyChartData = (start, end, progressEntries) => {
  const dailyData = buildDailyChartData("last30", start, end, progressEntries);
  const weeks = [];

  for (let index = 0; index < dailyData.length; index += 7) {
    weeks.push(dailyData.slice(index, index + 7));
  }

  return weeks.map((week, index) => ({
    key: `week-${index + 1}`,
    label: `Week ${index + 1}`,
    calories: week.reduce((sum, entry) => sum + Number(entry.calories || 0), 0) / Math.max(week.length, 1)
  }));
};

const buildYearChartData = (start, end, progressEntries) => {
  const year = start.getFullYear();
  const endMonth = end.getMonth();

  return Array.from({ length: endMonth + 1 }, (_, monthIndex) => {
    const monthStart = new Date(year, monthIndex, 1, 12);
    const monthEnd = monthIndex === endMonth ? end : new Date(year, monthIndex + 1, 0, 12);
    const monthEntries = progressEntries.filter((entry) => {
      const entryDate = createDateAtNoon(`${entry.date}T12:00:00`);
      return entryDate.getFullYear() === year && entryDate.getMonth() === monthIndex;
    });

    return {
      key: `month-${monthIndex}`,
      label: getMonthLabel(monthStart),
      calories: getAverageCalories(monthEntries, Math.round((monthEnd - monthStart) / DAY_MS) + 1)
    };
  });
};

const buildChartData = (range, rangeDates, progressEntries) => {
  if (range === "year") {
    return buildYearChartData(rangeDates.start, rangeDates.end, progressEntries);
  }

  if (range === "last30") {
    return buildWeeklyChartData(rangeDates.start, rangeDates.end, progressEntries);
  }

  return buildDailyChartData(range, rangeDates.start, rangeDates.end, progressEntries);
};

const getProgressEntries = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.weekly_progress)) return data.weekly_progress;
  if (Array.isArray(data?.daily)) return data.daily;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getChartSummary = (data, goal) => {
  const safeGoal = Number(goal) || 0;
  const total = data.length;
  const average = total ? data.reduce((sum, entry) => sum + Number(entry.calories || 0), 0) / total : 0;
  const overGoal = data.filter((entry) => Number(entry.calories || 0) > safeGoal).length;

  return {
    average,
    onTarget: total - overGoal,
    overGoal,
    total
  };
};

function MacroDonut({ progress, dark = false }) {
  const size = 280;
  const strokeWidth = 24;
  const radius = (178 - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const totalMacroCalories = macroColors.reduce(
    (sum, macro) => sum + (Number(progress[macro.key]) || 0) * macro.caloriesPerGram,
    0
  );
  let offset = 0;
  const segments = macroColors.map((macro) => {
    const calories = (Number(progress[macro.key]) || 0) * macro.caloriesPerGram;
    const segment = totalMacroCalories ? calories / totalMacroCalories : 0;
    const dash = segment * circumference;
    const startOffset = offset;
    const midpointOffset = offset + dash / 2;
    const midpointAngle = (midpointOffset / circumference) * 360 - 90;
    const angleRadians = (midpointAngle * Math.PI) / 180;
    const labelRadius = radius + 34;
    const lineStartRadius = radius + strokeWidth / 2 - 2;
    const lineEndRadius = radius + 21;
    const labelX = center + Math.cos(angleRadians) * labelRadius;
    const labelY = center + Math.sin(angleRadians) * labelRadius;
    const lineStartX = center + Math.cos(angleRadians) * lineStartRadius;
    const lineStartY = center + Math.sin(angleRadians) * lineStartRadius;
    const lineEndX = center + Math.cos(angleRadians) * lineEndRadius;
    const lineEndY = center + Math.sin(angleRadians) * lineEndRadius;

    offset += dash;

    return {
      ...macro,
      calories,
      dash,
      startOffset,
      labelX,
      labelY,
      lineStartX,
      lineStartY,
      lineEndX,
      lineEndY,
      textAnchor: labelX < center - 8 ? "end" : labelX > center + 8 ? "start" : "middle"
    };
  });

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E4F0DB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {segments.map((macro) => (
          <Circle
            key={macro.key}
            cx={center}
            cy={center}
            r={radius}
            stroke={macro.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${macro.dash} ${circumference - macro.dash}`}
            strokeDashoffset={-macro.startOffset}
            strokeLinecap="round"
            fill="transparent"
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        ))}
        {segments
          .filter((macro) => macro.calories > 0)
          .map((macro) => (
            <React.Fragment key={`${macro.key}-label`}>
              <Line
                x1={macro.lineStartX}
                y1={macro.lineStartY}
                x2={macro.lineEndX}
                y2={macro.lineEndY}
                stroke={macro.color}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <SvgText
                x={macro.labelX}
                y={macro.labelY}
                fill={macro.color}
                fontSize={13}
                fontWeight="800"
                textAnchor={macro.textAnchor}
                alignmentBaseline="middle"
              >
                {Math.round(macro.calories)}
              </SvgText>
            </React.Fragment>
          ))}
      </Svg>
      <View className="absolute items-center">
        <Text className={`text-3xl font-black ${dark ? "text-white" : "text-ink"}`}>{Math.round(progress.calories)}</Text>
        <Text className={`text-xs font-bold ${dark ? "text-white/60" : "text-cocoa"}`}>calories</Text>
      </View>
    </View>
  );
}

const getSmoothPath = (points, tension = 0.4) => {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(0, -1).reduce((path, point, index) => {
    const nextPoint = points[index + 1];
    const previousPoint = points[index - 1] || point;
    const followingPoint = points[index + 2] || nextPoint;
    const control1X = point.x + ((nextPoint.x - previousPoint.x) / 6) * tension;
    const control1Y = point.y + ((nextPoint.y - previousPoint.y) / 6) * tension;
    const control2X = nextPoint.x - ((followingPoint.x - point.x) / 6) * tension;
    const control2Y = nextPoint.y - ((followingPoint.y - point.y) / 6) * tension;

    return `${path} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${nextPoint.x} ${nextPoint.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
};

const getChartTickStep = (maxValue) => {
  if (maxValue <= 3000) return 500;
  if (maxValue <= 6000) return 1000;
  return 2000;
};

const buildYAxisTicks = (maxValue, tickStep) =>
  Array.from({ length: Math.floor(maxValue / tickStep) + 1 }, (_, index) => index * tickStep);

function CalorieLineChart({ data, goal, dark = false }) {
  const [activePointKey, setActivePointKey] = useState(null);
  const width = 320;
  const height = 236;
  const chartLeft = 44;
  const chartRight = 310;
  const chartTop = 34;
  const chartBottom = 178;
  const chartHeight = chartBottom - chartTop;
  const safeGoal = Number(goal) || 2500;
  const maxCalories = Math.max(safeGoal, ...data.map((entry) => Number(entry.calories) || 0), 1);
  const tickStep = getChartTickStep(maxCalories);
  const chartMax = Math.max(tickStep, Math.ceil(maxCalories / tickStep) * tickStep);
  const yAxisTicks = buildYAxisTicks(chartMax, tickStep);
  const overGoalCount = data.filter((entry) => Number(entry.calories || 0) > safeGoal).length;
  const lineColor = overGoalCount > data.length - overGoalCount ? OVER_GOAL_COLOR : UNDER_GOAL_COLOR;
  const xStep = data.length > 1 ? (chartRight - chartLeft) / (data.length - 1) : 0;
  const points = data.map((entry, index) => {
    const x = data.length > 1 ? chartLeft + index * xStep : (chartLeft + chartRight) / 2;
    const y = chartBottom - (Math.max(0, Number(entry.calories) || 0) / chartMax) * chartHeight;
    return { ...entry, x, y };
  });
  const activePoint = activePointKey ? points.find((point) => point.key === activePointKey) : null;
  const linePath = getSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`
    : "";
  const goalY = chartBottom - (safeGoal / chartMax) * chartHeight;
  const mutedColor = dark ? "rgba(255,255,255,0.55)" : colors.cocoa;
  const tickLabelColor = dark ? "rgba(255,255,255,0.62)" : "#888780";
  const axisColor = dark ? "rgba(255,255,255,0.34)" : "#9CB99D";
  const gridColor = dark ? "rgba(255,255,255,0.09)" : "#D7E6D1";
  const tooltipWidth = 142;
  const tooltipHeight = 56;
  const tooltipX = activePoint ? Math.min(Math.max(activePoint.x - tooltipWidth / 2, chartLeft + 4), chartRight - tooltipWidth - 4) : 0;
  const tooltipY = activePoint
    ? activePoint.y - tooltipHeight - 14 < chartTop + 18
      ? Math.min(activePoint.y + 14, chartBottom - tooltipHeight - 8)
      : activePoint.y - tooltipHeight - 14
    : 0;
  const activeDifference = activePoint ? Math.round(Number(activePoint.calories || 0) - safeGoal) : 0;
  const activeDifferenceLabel =
    activeDifference === 0
      ? "0 kcal on goal"
      : `${activeDifference > 0 ? "+" : "-"}${Math.abs(activeDifference).toLocaleString()} kcal ${
          activeDifference > 0 ? "over" : "under"
        } goal`;

  return (
    <View className="mt-5 w-full" style={{ width: "100%" }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgLinearGradient id="calorieAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.28" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0.04" />
          </SvgLinearGradient>
        </Defs>
        {yAxisTicks.map((tick) => {
          const y = chartBottom - (tick / chartMax) * chartHeight;

          return (
            <React.Fragment key={`y-axis-${tick}`}>
              <Line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke={gridColor} strokeWidth={tick === 0 ? 1.4 : 1} />
              <SvgText x={chartLeft - 8} y={y + 4} fill={mutedColor} fontSize={9} fontWeight="700" textAnchor="end">
                {tick.toLocaleString()}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} stroke={axisColor} strokeWidth={1.2} />
        <Line
          x1={chartLeft}
          y1={goalY}
          x2={chartRight}
          y2={goalY}
          stroke={dark ? "rgba(255,255,255,0.28)" : "#9CB99D"}
          strokeWidth={2}
          strokeDasharray="7 7"
        />
        <SvgText x={chartRight} y={Math.max(12, goalY - 8)} fill={mutedColor} fontSize={10} fontWeight="700" textAnchor="end">
          Goal {formatCalories(safeGoal)}
        </SvgText>
        {areaPath ? <Path d={areaPath} fill="url(#calorieAreaGradient)" /> : null}
        {linePath ? <Path d={linePath} fill="transparent" stroke={lineColor} strokeWidth={4} strokeLinecap="round" /> : null}
        {points.map((point) => (
          <Circle
            key={point.key}
            cx={point.x}
            cy={point.y}
            r={activePoint?.key === point.key ? 6 : 4.5}
            fill={lineColor}
            stroke={dark ? "#14231B" : "#FFFDF7"}
            strokeWidth={2}
          />
        ))}
        {points.map((point) => (
          <Circle
            key={`${point.key}-hit-area`}
            cx={point.x}
            cy={point.y}
            r={18}
            fill="transparent"
            onMouseEnter={() => setActivePointKey(point.key)}
            onMouseLeave={() => setActivePointKey(null)}
            onPress={() => setActivePointKey(point.key)}
          />
        ))}
        {activePoint ? (
          <React.Fragment>
            <Rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx={10}
              fill={dark ? "#20352A" : "#FFFDF7"}
              stroke={lineColor}
              strokeWidth={1.4}
            />
            <SvgText x={tooltipX + 10} y={tooltipY + 17} fill={dark ? "#FFFFFF" : colors.ink} fontSize={10} fontWeight="800">
              {activePoint.label}
            </SvgText>
            <SvgText x={tooltipX + 10} y={tooltipY + 32} fill={lineColor} fontSize={11} fontWeight="900">
              {formatCalories(activePoint.calories)}
            </SvgText>
            <SvgText x={tooltipX + 10} y={tooltipY + 47} fill={mutedColor} fontSize={9} fontWeight="800">
              {activeDifferenceLabel}
            </SvgText>
          </React.Fragment>
        ) : null}
        {points.map((point, index) => {
          const showLabel = data.length <= 7 || index === 0 || index === data.length - 1 || index % 2 === 0;
          if (!showLabel) return null;

          return (
            <SvgText
              key={`${point.key}-label`}
              x={point.x}
              y={216}
              fill={tickLabelColor}
              fontSize={11}
              fontWeight="700"
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function DateRangeInput({ value, onChange, max, dark = false }) {
  if (Platform.OS === "web") {
    return React.createElement("input", {
      type: "date",
      value,
      max,
      onChange: (event) => onChange(event.target.value),
      style: {
        width: "100%",
        borderWidth: 0,
        outline: "none",
        backgroundColor: "transparent",
        color: dark ? "#FFFFFF" : colors.ink,
        fontSize: 14,
        fontWeight: 800
      }
    });
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      placeholderTextColor="#A09689"
      className={`text-sm font-extrabold ${dark ? "text-white" : "text-ink"}`}
    />
  );
}

export default function ProgressScreen() {
  const { profile, isDark } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chartRange, setChartRange] = useState("last7");
  const [periodOffsets, setPeriodOffsets] = useState({ last30: 0 });
  const [sevenDayRange, setSevenDayRange] = useState(() => {
    const end = createDateAtNoon(new Date());
    return { start: addDays(end, -6), end };
  });
  const [isSevenDayPickerOpen, setIsSevenDayPickerOpen] = useState(false);
  const [sevenDayDraftRange, setSevenDayDraftRange] = useState(() => {
    const end = createDateAtNoon(new Date());
    return { start: toApiDateString(addDays(end, -6)), end: toApiDateString(end) };
  });
  const [sevenDayRangeError, setSevenDayRangeError] = useState("");
  const [progressEntries, setProgressEntries] = useState(dummyProgress);
  const dailyCalorieGoal = Number(profile.daily_calorie_goal ?? profile.dailyCalorieGoal ?? profile.targets?.calories) || 0;
  const chartGoal = dailyCalorieGoal || 2500;
  const rangeDates = useMemo(() => getRangeDates(chartRange, periodOffsets, sevenDayRange), [chartRange, periodOffsets, sevenDayRange]);
  const canNavigatePeriod = chartRange === "last30";
  const canNavigateForward = canNavigatePeriod && (periodOffsets[chartRange] || 0) < 0;
  const today = createDateAtNoon(new Date());
  const todayKey = toApiDateString(today);
  const canNavigateSevenDayForward = chartRange === "last7" && createDateAtNoon(sevenDayRange.end) < today;
  const sevenDayRangeLabel = getDateRangeLabel(sevenDayRange.start, sevenDayRange.end);

  const movePeriod = (direction) => {
    if (!canNavigatePeriod) return;
    setPeriodOffsets((current) => ({
      ...current,
      [chartRange]: Math.min(0, (current[chartRange] || 0) + direction)
    }));
  };

  const setSevenDaySelection = (start, end) => {
    setSevenDayRange({ start, end });
    setSevenDayDraftRange({ start: toApiDateString(start), end: toApiDateString(end) });
    setSevenDayRangeError("");
  };

  const moveSevenDayRange = (direction) => {
    const rangeLength = getRangeLength(sevenDayRange.start, sevenDayRange.end);
    let nextStart = addDays(sevenDayRange.start, direction * rangeLength);
    let nextEnd = addDays(sevenDayRange.end, direction * rangeLength);

    if (direction > 0 && nextEnd > today) {
      nextEnd = today;
      nextStart = addDays(nextEnd, -(rangeLength - 1));
    }

    setSevenDaySelection(nextStart, nextEnd);
  };

  const openSevenDayPicker = () => {
    setSevenDayDraftRange({ start: toApiDateString(sevenDayRange.start), end: toApiDateString(sevenDayRange.end) });
    setSevenDayRangeError("");
    setIsSevenDayPickerOpen(true);
  };

  const applySevenDayRange = (startKey = sevenDayDraftRange.start, endKey = sevenDayDraftRange.end) => {
    const start = parseDateKey(startKey);
    const end = parseDateKey(endKey);

    if (!start || !end) {
      setSevenDayRangeError("Use valid dates");
      return false;
    }

    if (end < start) {
      setSevenDayRangeError("End date must be on or after start date");
      return false;
    }

    if (getRangeLength(start, end) > 7) {
      setSevenDayRangeError("Maximum range is 7 days");
      return false;
    }

    if (end > today) {
      setSevenDayRangeError("End date cannot be in the future");
      return false;
    }

    setSevenDaySelection(start, end);
    setIsSevenDayPickerOpen(false);
    return true;
  };

  const applySevenDayPreset = (days) => {
    const end = today;
    const start = addDays(end, -(days - 1));
    setSevenDaySelection(start, end);
    setIsSevenDayPickerOpen(false);
  };

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const start = toApiDateString(rangeDates.start);
      const end = toApiDateString(rangeDates.end);

      const loadProgress = async () => {
        try {
          const data = await fetchProgress({ start, end });
          const nextEntries = getProgressEntries(data);

          if (mounted) {
            setProgressEntries(nextEntries.map(normalizeProgressEntry));
          }
        } catch (error) {
          console.error("[ProgressScreen] fetchProgress:error", error);
        }
      };

      loadProgress();
      return () => {
        mounted = false;
      };
    }, [rangeDates])
  );

  const selectedKey = formatDateKey(selectedDate);
  const selectedProgress = useMemo(
    () =>
      progressEntries.find((entry) => entry.date === selectedKey) ||
      progressEntries[progressEntries.length - 1] || {
        date: selectedKey,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
    [progressEntries, selectedKey]
  );
  const chartData = useMemo(
    () => buildChartData(chartRange, rangeDates, progressEntries),
    [chartRange, progressEntries, rangeDates]
  );
  const thirtyDayDailyData = useMemo(
    () => (chartRange === "last30" ? buildDailyChartData("last30", rangeDates.start, rangeDates.end, progressEntries) : []),
    [chartRange, progressEntries, rangeDates]
  );
  const chartSummary = useMemo(
    () => getChartSummary(chartRange === "last30" ? thirtyDayDailyData : chartData, chartGoal),
    [chartData, chartGoal, chartRange, thirtyDayDailyData]
  );
  const bestWeek = useMemo(
    () => (chartData.length ? chartData.reduce((best, entry) => (entry.calories < best.calories ? entry : best), chartData[0]) : null),
    [chartData]
  );
  const worstWeek = useMemo(
    () => (chartData.length ? chartData.reduce((worst, entry) => (entry.calories > worst.calories ? entry : worst), chartData[0]) : null),
    [chartData]
  );
  const summaryUnitLabel = chartRange === "year" ? "monthly" : "daily";
  const chartTitle = {
    last7: "7 days",
    last30: "30 days",
    year: "This year"
  }[chartRange];
  const summaryMetrics =
    chartRange === "last30"
      ? [
          { label: "Average daily calories", value: formatCalories(chartSummary.average) },
          { label: "Best week", value: bestWeek ? `${bestWeek.label}: ${formatCalories(bestWeek.calories)}` : "Week 1: 0 Kcal" },
          { label: "Worst week", value: worstWeek ? `${worstWeek.label}: ${formatCalories(worstWeek.calories)}` : "Week 1: 0 Kcal" }
        ]
      : [
          {
            label: `Average ${summaryUnitLabel} calories`,
            value: formatCalories(chartSummary.average)
          },
          {
            label: chartRange === "year" ? "Months on target" : "Days on target",
            value: `${chartSummary.onTarget}/${chartSummary.total}`
          },
          {
            label: chartRange === "year" ? "Months over goal" : "Days over goal",
            value: `${chartSummary.overGoal}/${chartSummary.total}`
          }
        ];

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title="Progress" subtitle="Calories and macros" dark={isDark} />
        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} dark={isDark} />

        <ClayCard dark={isDark}>
          <View className="items-center">
            <MacroDonut progress={selectedProgress} dark={isDark} />
          </View>
          <View className="mt-6 gap-3">
            {macroColors.map((macro) => {
              const macroCalories = (Number(selectedProgress[macro.key]) || 0) * macro.caloriesPerGram;

              return (
              <View
                key={macro.key}
                className={`flex-row items-center justify-between rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}
              >
                <View className="flex-row items-center">
                  <View className="mr-3 h-3 w-3 rounded-full" style={{ backgroundColor: macro.color }} />
                  <Text className={`font-bold ${isDark ? "text-white" : "text-ink"}`}>{macro.label}</Text>
                </View>
                <Text className={`font-extrabold ${isDark ? "text-white" : "text-ink"}`}>
                  {formatMacro(selectedProgress[macro.key])} - {Math.round(macroCalories)} kcal
                </Text>
              </View>
              );
            })}
          </View>
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className={`text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>{chartTitle}</Text>
              {canNavigatePeriod ? (
                <View className="ml-3 flex-row gap-2">
                  <Pressable
                    onPress={() => movePeriod(-1)}
                    className={`h-8 w-8 items-center justify-center rounded-full ${isDark ? "bg-white/5" : "bg-sage-50"}`}
                  >
                    <Text className={`text-base font-black ${isDark ? "text-white" : "text-ink"}`}>{"<"}</Text>
                  </Pressable>
                  <Pressable
                    disabled={!canNavigateForward}
                    onPress={() => movePeriod(1)}
                    className={`h-8 w-8 items-center justify-center rounded-full ${isDark ? "bg-white/5" : "bg-sage-50"}`}
                    style={{ opacity: canNavigateForward ? 1 : 0.35 }}
                  >
                    <Text className={`text-base font-black ${isDark ? "text-white" : "text-ink"}`}>{">"}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
            <Text className={`text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
              Goal: {formatCalories(chartGoal)}
            </Text>
          </View>
          <View className={`mb-5 flex-row rounded-[22px] p-1 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
            {chartRanges.map((range) => {
              const selected = chartRange === range.key;
              return (
                <Pressable
                  key={range.key}
                  onPress={() => setChartRange(range.key)}
                  className="h-10 flex-1 items-center justify-center rounded-[18px]"
                  style={{ backgroundColor: selected ? colors.primary : "transparent" }}
                >
                  <Text className={`text-xs font-black ${selected ? "text-white" : isDark ? "text-white/70" : "text-cocoa"}`}>
                    {range.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {chartRange === "last7" ? (
            <>
              <View className={`mb-4 flex-row items-center rounded-[22px] p-2 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
                <Pressable
                  onPress={() => moveSevenDayRange(-1)}
                  className={`h-10 w-10 items-center justify-center rounded-[18px] ${isDark ? "bg-white/5" : "bg-white"}`}
                >
                  <Text className={`text-base font-black ${isDark ? "text-white" : "text-ink"}`}>{"<"}</Text>
                </Pressable>
                <Pressable
                  onPress={openSevenDayPicker}
                  className="mx-3 h-10 flex-1 items-center justify-center rounded-[18px]"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-sm font-black text-white">{sevenDayRangeLabel}</Text>
                </Pressable>
                <Pressable
                  disabled={!canNavigateSevenDayForward}
                  onPress={() => moveSevenDayRange(1)}
                  className={`h-10 w-10 items-center justify-center rounded-[18px] ${isDark ? "bg-white/5" : "bg-white"}`}
                  style={{ opacity: canNavigateSevenDayForward ? 1 : 0.35 }}
                >
                  <Text className={`text-base font-black ${isDark ? "text-white" : "text-ink"}`}>{">"}</Text>
                </Pressable>
              </View>

              {isSevenDayPickerOpen ? (
                <View className={`mb-5 gap-3 rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { label: "Today", days: 1 },
                      { label: "Last 3 days", days: 3 },
                      { label: "Last 7 days", days: 7 }
                    ].map((preset) => (
                      <Pressable
                        key={preset.label}
                        onPress={() => applySevenDayPreset(preset.days)}
                        className="h-9 items-center justify-center rounded-[16px] px-4"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Text className="text-xs font-black text-white">{preset.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View className="flex-row gap-3">
                    <View className={`flex-1 rounded-[18px] px-4 py-3 ${isDark ? "bg-black/10" : "bg-white"}`}>
                      <Text className={`mb-2 text-[10px] font-black uppercase ${isDark ? "text-white/50" : "text-cocoa"}`}>Start date</Text>
                      <DateRangeInput
                        value={sevenDayDraftRange.start}
                        onChange={(value) => setSevenDayDraftRange((current) => ({ ...current, start: value }))}
                        max={todayKey}
                        dark={isDark}
                      />
                    </View>
                    <View className={`flex-1 rounded-[18px] px-4 py-3 ${isDark ? "bg-black/10" : "bg-white"}`}>
                      <Text className={`mb-2 text-[10px] font-black uppercase ${isDark ? "text-white/50" : "text-cocoa"}`}>End date</Text>
                      <DateRangeInput
                        value={sevenDayDraftRange.end}
                        onChange={(value) => setSevenDayDraftRange((current) => ({ ...current, end: value }))}
                        max={todayKey}
                        dark={isDark}
                      />
                    </View>
                  </View>
                  {sevenDayRangeError ? <Text className="text-xs font-bold text-[#E24B4A]">{sevenDayRangeError}</Text> : null}
                  <View className="flex-row justify-end gap-2">
                    <Pressable
                      onPress={() => {
                        setIsSevenDayPickerOpen(false);
                        setSevenDayRangeError("");
                      }}
                      className={`h-10 items-center justify-center rounded-[18px] px-5 ${isDark ? "bg-white/5" : "bg-white"}`}
                    >
                      <Text className={`text-xs font-black ${isDark ? "text-white/70" : "text-cocoa"}`}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => applySevenDayRange()}
                      className="h-10 items-center justify-center rounded-[18px] px-5"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-xs font-black text-white">Apply</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

          
            </>
          ) : null}

          <CalorieLineChart data={chartData} goal={chartGoal} dark={isDark} />
        </ClayCard>
      </ScrollView>
    </View>
  );
}
