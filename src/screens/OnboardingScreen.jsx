import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import ClayCard from "../components/ClayCard";
import PrimaryButton from "../components/PrimaryButton";
import colors from "../constants/colors";
import { calculateDailyTargets } from "../utils/calorieCalculator";
import { formatCalories, formatMacro } from "../utils/formatters";
import { useApp } from "../utils/appState";

const steps = [
  {
    key: "weightKg",
    title: "Your Current Weight",
    placeholder: "Enter Your Current Weight",
    keyboardType: "decimal-pad"
  },
  {
    key: "age",
    title: "Date of Birth"
  },
  {
    key: "gender",
    title: "Gender",
    options: ["Male", "Female", "Other"]
  },
  {
    key: "heightCm",
    title: "Your Height"
  },
  {
    key: "activity",
    title: "How active are you?",
    options: ["no activity", "normal walk", "gym/light active", "very active"]
  }
];

const initialForm = {
  goal: "maintenance",
  age: "",
  gender: "Female",
  heightCm: "",
  weightKg: "",
  activity: "normal walk"
};

const goalLabels = {
  weight_loss: "Weight loss",
  weight_gain: "Weight gain",
  maintenance: "Maintenance"
};

const monthOptions = [
  { value: 0, label: "Jan" },
  { value: 1, label: "Feb" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Apr" },
  { value: 4, label: "May" },
  { value: 5, label: "Jun" },
  { value: 6, label: "Jul" },
  { value: 7, label: "Aug" },
  { value: 8, label: "Sep" },
  { value: 9, label: "Oct" },
  { value: 10, label: "Nov" },
  { value: 11, label: "Dec" }
];

const sanitizeDecimalInput = (value) => {
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const [whole, ...decimalParts] = cleaned.split(".");
  return decimalParts.length ? `${whole}.${decimalParts.join("")}` : whole;
};

const sanitizeIntegerInput = (value) => String(value).replace(/[^0-9]/g, "");

const getGoalType = (currentWeight, goalWeight) => {
  const current = Number(currentWeight);
  const goal = Number(goalWeight);

  if (!Number.isFinite(current) || !Number.isFinite(goal) || current <= 0 || goal <= 0) {
    return "maintenance";
  }

  if (current > goal) return "weight_loss";
  if (current < goal) return "weight_gain";
  return "maintenance";
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const getDefaultDob = () => {
  const today = new Date();
  return new Date(today.getFullYear() - 22, today.getMonth(), today.getDate());
};

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 101 }, (_, index) => currentYear - index);
};

const clampDob = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate > today ? today : nextDate;
};

const calculateAgeFromDob = (dob) => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const birthdayHasPassed =
    today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!birthdayHasPassed) age -= 1;
  return Math.max(0, age);
};

const formatDob = (dob) =>
  dob.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

const titleCase = (value) =>
  value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [currentWeightInput, setCurrentWeightInput] = useState("");
  const [goalWeightInput, setGoalWeightInput] = useState("");
  const [selectedDob, setSelectedDob] = useState(getDefaultDob);
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [saving, setSaving] = useState(false);
  const currentStep = steps[stepIndex];
  const isResultStep = stepIndex >= steps.length;
  const yearOptions = useMemo(() => getYearOptions(), []);
  const dayOptions = useMemo(
    () =>
      Array.from({ length: getDaysInMonth(selectedDob.getFullYear(), selectedDob.getMonth()) }, (_, index) => index + 1),
    [selectedDob]
  );
  const heightDisplay = heightFeet || heightInches ? `${heightFeet || 0} ft ${heightInches || 0} in` : "";

  const normalizedProfile = useMemo(
    () => ({
      goal: form.goal,
      age: Number.isFinite(Number(form.age)) ? Number(form.age) : 22,
      gender: form.gender,
      heightCm: Number(form.heightCm) || 165,
      weightKg: Number(form.weightKg) || 70,
      activity: form.activity
    }),
    [form]
  );

  const targets = useMemo(() => calculateDailyTargets(normalizedProfile), [normalizedProfile]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    setForm((current) => ({ ...current, age: String(calculateAgeFromDob(selectedDob)) }));
  }, [selectedDob]);

  const syncWeightForm = (nextCurrentWeight, nextGoalWeight) => {
    const currentWeight = Number(nextCurrentWeight);
    const nextGoal = getGoalType(nextCurrentWeight, nextGoalWeight);
    const nextWeightKg = Number.isFinite(currentWeight) && currentWeight > 0 ? String(Number(currentWeight.toFixed(1))) : "";

    setForm((current) => ({
      ...current,
      weightKg: nextWeightKg,
      goal: nextGoal
    }));
  };

  const handleCurrentWeightChange = (value) => {
    const nextValue = sanitizeDecimalInput(value);
    setCurrentWeightInput(nextValue);
    syncWeightForm(nextValue, goalWeightInput);
  };

  const handleGoalWeightChange = (value) => {
    const nextValue = sanitizeDecimalInput(value);
    setGoalWeightInput(nextValue);
    syncWeightForm(currentWeightInput, nextValue);
  };

  const updateDob = ({ year = selectedDob.getFullYear(), month = selectedDob.getMonth(), day = selectedDob.getDate() }) => {
    const safeDay = Math.min(day, getDaysInMonth(year, month));
    setSelectedDob(clampDob(new Date(year, month, safeDay)));
  };

  const syncHeightForm = (feetText, inchesText) => {
    const feet = Number(feetText) || 0;
    const inches = Number(inchesText) || 0;
    const heightCm = Math.round((feet * 12 + inches) * 2.54);

    setForm((current) => ({
      ...current,
      heightCm: heightCm > 0 ? String(heightCm) : ""
    }));
  };

  const handleHeightFeetChange = (value) => {
    const nextValue = sanitizeIntegerInput(value);
    setHeightFeet(nextValue);
    syncHeightForm(nextValue, heightInches);
  };

  const handleHeightInchesChange = (value) => {
    const sanitized = sanitizeIntegerInput(value);
    const nextValue = sanitized ? String(Math.min(Number(sanitized), 11)) : "";
    setHeightInches(nextValue);
    syncHeightForm(heightFeet, nextValue);
  };

  const isPositiveNumber = (value) => Number(value) > 0;
  const canContinue =
    isResultStep ||
    (currentStep.key === "weightKg"
      ? isPositiveNumber(currentWeightInput) && isPositiveNumber(goalWeightInput)
      : currentStep.key === "age"
        ? Boolean(selectedDob)
        : currentStep.key === "heightCm"
          ? Number(form.heightCm) > 0
          : Boolean(String(form[currentStep.key] || "").trim()));

  const handleNext = async () => {
    if (isResultStep) {
      setSaving(true);
      try {
        await completeOnboarding(normalizedProfile);
      } catch (error) {
        Alert.alert("Profile setup failed", "Please try saving your profile again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    setStepIndex((index) => Math.min(index + 1, steps.length));
  };

  const handleBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  return (
    <LinearGradient colors={["#F3F8EF", "#FFF8EA"]} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, flexGrow: 1 }}>
          <View className="mb-8 flex-row items-center justify-between">
            <Pressable
              onPress={handleBack}
              disabled={stepIndex === 0}
              className="h-11 w-11 items-center justify-center rounded-2xl bg-white/70"
            >
              <Ionicons name="chevron-back" size={22} color={stepIndex === 0 ? "#C7C0B6" : colors.primaryDark} />
            </Pressable>
            <Text className="text-sm font-extrabold text-leaf-700">
              {Math.min(stepIndex + 1, steps.length + 1)} / {steps.length + 1}
            </Text>
          </View>

          <View className="mb-8 h-3 overflow-hidden rounded-full bg-sage-100">
            <View
              className="h-3 rounded-full bg-leaf-500"
              style={{ width: `${((stepIndex + 1) / (steps.length + 1)) * 100}%` }}
            />
          </View>

          {!isResultStep ? (
            <ClayCard className="min-h-[360px] justify-between">
              <View>
                <Text className="text-3xl font-black leading-tight text-ink">{currentStep.title}</Text>
                {currentStep.options ? (
                  <View className="mt-8 gap-3">
                    {currentStep.options.map((option) => {
                      const selected = form[currentStep.key] === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => updateField(currentStep.key, option)}
                          className="flex-row items-center justify-between rounded-[24px] border p-4"
                          style={{
                            backgroundColor: selected ? colors.secondary : "#FFFFFF",
                            borderColor: selected ? colors.primary : colors.border
                          }}
                        >
                          <Text className="text-base font-bold text-ink">{titleCase(option)}</Text>
                          <Ionicons
                            name={selected ? "checkmark-circle" : "ellipse-outline"}
                            size={22}
                            color={selected ? colors.primary : "#B7AEA2"}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                ) : currentStep.key === "weightKg" ? (
                  <View className="mt-8 gap-4">
                    <View>
                      <Text className="mb-2 text-sm font-bold text-cocoa">Current Weight (kg)</Text>
                      <TextInput
                        value={currentWeightInput}
                        onChangeText={handleCurrentWeightChange}
                        placeholder="Enter your current weight"
                        keyboardType="decimal-pad"
                        className="h-16 rounded-[26px] bg-sage-50 px-5 text-xl font-bold text-ink"
                        placeholderTextColor="#A09689"
                      />
                    </View>

                    <View>
                      <Text className="mb-2 text-sm font-bold text-cocoa">Goal Weight (kg)</Text>
                      <TextInput
                        value={goalWeightInput}
                        onChangeText={handleGoalWeightChange}
                        placeholder="Enter your goal weight"
                        keyboardType="decimal-pad"
                        className="h-16 rounded-[26px] bg-sage-50 px-5 text-xl font-bold text-ink"
                        placeholderTextColor="#A09689"
                      />
                    </View>

                    <View className="rounded-[22px] bg-mint-100 p-4">
                      <Text className="text-xs font-bold text-cocoa">Goal</Text>
                      <Text className="mt-1 text-lg font-black text-leaf-700">{goalLabels[form.goal]}</Text>
                    </View>
                  </View>
                ) : currentStep.key === "age" ? (
                  <View className="mt-8">
                    <View className="rounded-[22px] bg-mint-100 p-4">
                      <Text className="text-xs font-bold text-cocoa">Selected DOB</Text>
                      <Text className="mt-1 text-xl font-black text-leaf-700">{formatDob(selectedDob)}</Text>
                      <Text className="mt-1 text-sm font-bold text-cocoa">{form.age} years old</Text>
                    </View>

                    <View className="mt-5">
                      <Text className="mb-3 text-sm font-bold text-cocoa">Month</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2 pr-4">
                          {monthOptions.map((month) => {
                            const selected = selectedDob.getMonth() === month.value;
                            return (
                              <Pressable
                                key={month.value}
                                onPress={() => updateDob({ month: month.value })}
                                className="h-11 items-center justify-center rounded-full px-4"
                                style={{ backgroundColor: selected ? colors.primary : "#F3F8EF" }}
                              >
                                <Text className={`font-black ${selected ? "text-white" : "text-ink"}`}>{month.label}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    <View className="mt-5">
                      <Text className="mb-3 text-sm font-bold text-cocoa">Day</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2 pr-4">
                          {dayOptions.map((day) => {
                            const selected = selectedDob.getDate() === day;
                            return (
                              <Pressable
                                key={day}
                                onPress={() => updateDob({ day })}
                                className="h-11 w-11 items-center justify-center rounded-full"
                                style={{ backgroundColor: selected ? colors.primary : "#F3F8EF" }}
                              >
                                <Text className={`font-black ${selected ? "text-white" : "text-ink"}`}>{day}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    <View className="mt-5">
                      <Text className="mb-3 text-sm font-bold text-cocoa">Year</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2 pr-4">
                          {yearOptions.map((year) => {
                            const selected = selectedDob.getFullYear() === year;
                            return (
                              <Pressable
                                key={year}
                                onPress={() => updateDob({ year })}
                                className="h-11 items-center justify-center rounded-full px-4"
                                style={{ backgroundColor: selected ? colors.primary : "#F3F8EF" }}
                              >
                                <Text className={`font-black ${selected ? "text-white" : "text-ink"}`}>{year}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                ) : currentStep.key === "heightCm" ? (
                  <View className="mt-8">
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="mb-2 text-sm font-bold text-cocoa">Feet</Text>
                        <TextInput
                          value={heightFeet}
                          onChangeText={handleHeightFeetChange}
                          placeholder="ft"
                          keyboardType="number-pad"
                          maxLength={2}
                          className="h-16 rounded-[26px] bg-sage-50 px-5 text-xl font-bold text-ink"
                          placeholderTextColor="#A09689"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="mb-2 text-sm font-bold text-cocoa">Inches</Text>
                        <TextInput
                          value={heightInches}
                          onChangeText={handleHeightInchesChange}
                          placeholder="in"
                          keyboardType="number-pad"
                          maxLength={2}
                          className="h-16 rounded-[26px] bg-sage-50 px-5 text-xl font-bold text-ink"
                          placeholderTextColor="#A09689"
                        />
                      </View>
                    </View>

                    <View className="mt-5 rounded-[22px] bg-mint-100 p-4">
                      <Text className="text-xs font-bold text-cocoa">Height</Text>
                      <Text className="mt-1 text-lg font-black text-leaf-700">
                        {heightDisplay || "0 ft 0 in"}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="mt-12">
                    <TextInput
                      value={form[currentStep.key]}
                      onChangeText={(value) => updateField(currentStep.key, value)}
                      placeholder={currentStep.placeholder}
                      keyboardType={currentStep.keyboardType}
                      className="h-16 rounded-[26px] bg-sage-50 px-5 text-xl font-bold text-ink"
                      placeholderTextColor="#A09689"
                    />
                  </View>
                )}
              </View>

              <PrimaryButton
                title={stepIndex === steps.length - 1 ? "Calculate" : "Next"}
                icon="arrow-forward"
                onPress={handleNext}
                disabled={!canContinue}
                className="mt-8"
              />
            </ClayCard>
          ) : (
            <ClayCard>
              <View className="items-center">
                <View className="mb-5 h-28 w-28 items-center justify-center rounded-full bg-mint-100">
                  <Text className="text-3xl font-black text-leaf-700">{targets.calories}</Text>
                  <Text className="text-xs font-bold text-cocoa">Kcal/day</Text>
                </View>
                <Text className="text-center text-3xl font-black text-ink">Your daily targets</Text>
              </View>

              <View className="mt-8 gap-3">
                <View className="flex-row justify-between rounded-[22px] bg-sage-50 p-4">
                  <Text className="font-bold text-cocoa">Calories</Text>
                  <Text className="font-extrabold text-ink">{formatCalories(targets.calories)}</Text>
                </View>
                <View className="flex-row justify-between rounded-[22px] bg-sage-50 p-4">
                  <Text className="font-bold text-cocoa">Protein</Text>
                  <Text className="font-extrabold text-ink">{formatMacro(targets.protein)}</Text>
                </View>
                <View className="flex-row justify-between rounded-[22px] bg-sage-50 p-4">
                  <Text className="font-bold text-cocoa">Carbs</Text>
                  <Text className="font-extrabold text-ink">{formatMacro(targets.carbs)}</Text>
                </View>
                <View className="flex-row justify-between rounded-[22px] bg-sage-50 p-4">
                  <Text className="font-bold text-cocoa">Fat</Text>
                  <Text className="font-extrabold text-ink">{formatMacro(targets.fat)}</Text>
                </View>
              </View>

              <PrimaryButton
                title={saving ? "Saving" : "Start Tracking"}
                icon="checkmark"
                onPress={handleNext}
                disabled={saving}
                className="mt-8"
              />
            </ClayCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
