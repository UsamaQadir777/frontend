import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppHeader from "../components/AppHeader";
import ClayCard from "../components/ClayCard";
import PrimaryButton from "../components/PrimaryButton";
import colors from "../constants/colors";
import { useApp } from "../utils/appState";
import { formatCalories, formatMacro } from "../utils/formatters";

const goalOptions = ["lose weight", "gain weight", "maintain weight"];
const activityOptions = ["no activity", "normal walk", "gym/light active", "very active"];
const genderOptions = ["Male", "Female", "Other"];

const titleCase = (value) =>
  value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function ProfileRow({ icon, label, value, dark = false }) {
  return (
    <View className={`mb-3 flex-row items-center rounded-[22px] p-4 ${dark ? "bg-white/5" : "bg-sage-50"}`}>
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-mint-100">
        <Ionicons name={icon} size={19} color={colors.primaryDark} />
      </View>
      <Text className={`flex-1 font-bold ${dark ? "text-white" : "text-ink"}`}>{label}</Text>
      <Text className={`font-extrabold ${dark ? "text-white/70" : "text-cocoa"}`}>{value}</Text>
    </View>
  );
}

function PillOption({ label, selected, onPress, dark = false }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-4 py-3"
      style={{ backgroundColor: selected ? colors.primary : dark ? "rgba(255,255,255,0.06)" : "#F3F8EF" }}
    >
      <Text className={`font-bold ${selected ? "text-white" : dark ? "text-white" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}

function EditInput({ label, value, onChangeText, keyboardType = "default", dark = false }) {
  return (
    <View className="mb-4">
      <Text className={`mb-2 text-sm font-bold ${dark ? "text-white/70" : "text-cocoa"}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        className={`h-14 rounded-[24px] px-5 text-base font-bold ${dark ? "bg-white/5 text-white" : "bg-sage-50 text-ink"}`}
        placeholderTextColor="#A09689"
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, updateProfile, themeMode, toggleTheme, logout, isDark } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile.name,
    goal: profile.goal,
    age: String(profile.age),
    gender: profile.gender,
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    activity: profile.activity
  });

  useEffect(() => {
    if (!editing) {
      setForm({
        name: profile.name,
        goal: profile.goal,
        age: String(profile.age),
        gender: profile.gender,
        heightCm: String(profile.heightCm),
        weightKg: String(profile.weightKg),
        activity: profile.activity
      });
    }
  }, [editing, profile]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveProfile = async () => {
    try {
      await updateProfile({
        ...form,
        age: Number(form.age) || profile.age,
        heightCm: Number(form.heightCm) || profile.heightCm,
        weightKg: Number(form.weightKg) || profile.weightKg
      });
      setEditing(false);
    } catch (error) {
      Alert.alert("Profile update failed", "Please try again.");
    }
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-sage-900" : "bg-sage-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 122 }}>
        <AppHeader title="Me" subtitle={profile.name} dark={isDark} />

        <ClayCard dark={isDark}>
          <View className="items-center">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-[32px] bg-mint-100">
              <Ionicons name="person" size={42} color={colors.primaryDark} />
            </View>
            <Text className={`text-2xl font-black ${isDark ? "text-white" : "text-ink"}`}>{profile.name}</Text>
            <Text className={`mt-1 text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
              {titleCase(profile.goal)}
            </Text>
          </View>

          {/* <View className="mt-7 flex-row gap-3">
            <View className={`flex-1 rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
              <Text className={`text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>Calories</Text>
              <Text className={`mt-1 text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>
                {formatCalories(profile.targets.calories)}
              </Text>
            </View>
            <View className={`flex-1 rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
              <Text className={`text-xs font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>Protein</Text>
              <Text className={`mt-1 text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>
                {formatMacro(profile.targets.protein)}
              </Text>
            </View>
          </View> */}
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <View className="mb-5 flex-row items-center justify-between">
            <Text className={`text-xl font-black ${isDark ? "text-white" : "text-ink"}`}>Profile data</Text>
            <Pressable onPress={() => setEditing((value) => !value)} className="h-10 w-10 items-center justify-center rounded-2xl bg-mint-100">
              <Ionicons name={editing ? "close" : "create-outline"} size={20} color={colors.primaryDark} />
            </Pressable>
          </View>

          {!editing ? (
            <View>
              <ProfileRow icon="person-outline" label="Gender" value={profile.gender} dark={isDark} />
              <ProfileRow icon="calendar-outline" label="Age" value={`${profile.age}`} dark={isDark} />
              <ProfileRow icon="resize-outline" label="Height" value={`${profile.heightCm} cm`} dark={isDark} />
              <ProfileRow icon="barbell-outline" label="Weight" value={`${profile.weightKg} kg`} dark={isDark} />
              {/* <ProfileRow icon="walk-outline" label="Activity" value={titleCase(profile.activity)} dark={isDark} /> */}
            </View>
          ) : (
            <View>
              <EditInput label="Name" value={form.name} onChangeText={(value) => updateField("name", value)} dark={isDark} />
              <EditInput
                label="Age"
                value={form.age}
                onChangeText={(value) => updateField("age", value)}
                keyboardType="number-pad"
                dark={isDark}
              />
              <EditInput
                label="Height"
                value={form.heightCm}
                onChangeText={(value) => updateField("heightCm", value)}
                keyboardType="number-pad"
                dark={isDark}
              />
              <EditInput
                label="Weight"
                value={form.weightKg}
                onChangeText={(value) => updateField("weightKg", value)}
                keyboardType="number-pad"
                dark={isDark}
              />

              <Text className={`mb-3 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Goal</Text>
              <View className="mb-5 flex-row flex-wrap gap-3">
                {goalOptions.map((goal) => (
                  <PillOption
                    key={goal}
                    label={titleCase(goal)}
                    selected={form.goal === goal}
                    onPress={() => updateField("goal", goal)}
                    dark={isDark}
                  />
                ))}
              </View>

              <Text className={`mb-3 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Gender</Text>
              <View className="mb-5 flex-row flex-wrap gap-3">
                {genderOptions.map((gender) => (
                  <PillOption
                    key={gender}
                    label={gender}
                    selected={form.gender === gender}
                    onPress={() => updateField("gender", gender)}
                    dark={isDark}
                  />
                ))}
              </View>

              <Text className={`mb-3 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Activity</Text>
              <View className="mb-6 flex-row flex-wrap gap-3">
                {activityOptions.map((activity) => (
                  <PillOption
                    key={activity}
                    label={titleCase(activity)}
                    selected={form.activity === activity}
                    onPress={() => updateField("activity", activity)}
                    dark={isDark}
                  />
                ))}
              </View>

              <PrimaryButton title="Save Changes" icon="checkmark" onPress={saveProfile} />
            </View>
          )}
        </ClayCard>

        <ClayCard className="mt-5" dark={isDark}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-mint-100">
                <Ionicons name={themeMode === "dark" ? "moon" : "sunny"} size={20} color={colors.primaryDark} />
              </View>
              <Text className={`font-bold ${isDark ? "text-white" : "text-ink"}`}>Dark mode</Text>
            </View>
            <Switch
              value={themeMode === "dark"}
              onValueChange={toggleTheme}
              thumbColor="#FFFFFF"
              trackColor={{ false: "#CFE4C3", true: colors.primary }}
            />
          </View>
        </ClayCard>

        <PrimaryButton title="Logout" icon="log-out-outline" variant="ghost" onPress={logout} className="mt-5" />
      </ScrollView>
    </View>
  );
}
