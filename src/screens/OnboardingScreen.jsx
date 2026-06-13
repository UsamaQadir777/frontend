import React, { useMemo, useState } from "react";
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
    key: "name",
    title: "What is your name?",
    placeholder: "Your Good Name",
    keyboardType: "default"
  },
  {
    key: "weightKg",
    title: "Your Current Weight",
    placeholder: "Enter Your Current Weight",
    keyboardType: "number-pad"
  },
  {
    key: "goal",
    title: "What is your goal?",
    options: ["lose weight", "gain weight", "maintain weight"]
  },
  {
    key: "age",
    title: "How old are you?",
    placeholder: "Enter Your Age",
    keyboardType: "number-pad"
  },
  {
    key: "gender",
    title: "Gender",
    options: ["Male", "Female", "Other"]
  },
  {
    key: "heightCm",
    title: "Your Height",
    placeholder: "Enter Your Height In cm",
    keyboardType: "number-pad"
  },
  {
    key: "activity",
    title: "How active are you?",
    options: ["no activity", "normal walk", "gym/light active", "very active"]
  }
];

const initialForm = {
  name: "",
  goal: "lose weight",
  age: "",
  gender: "Female",
  heightCm: "",
  weightKg: "",
  activity: "normal walk"
};

const labels = {
  heightCm: "Height in cm",
  weightKg: "Weight in kg"
};

const titleCase = (value) =>
  value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const currentStep = steps[stepIndex];
  const isResultStep = stepIndex >= steps.length;

  const normalizedProfile = useMemo(
    () => ({
      name: form.name.trim() || "Friend",
      goal: form.goal,
      age: Number(form.age) || 22,
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

  const canContinue = isResultStep || Boolean(String(form[currentStep.key] || "").trim());

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
                ) : (
                  <View className="mt-12">
                    {/* <Text className="mb-3 text-sm font-bold text-cocoa">
                      {labels[currentStep.key] || currentStep.title}
                    </Text> */}
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
