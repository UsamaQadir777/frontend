import React, { useEffect, useMemo, useState } from "react";
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

const titleCase = (value) =>
  value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const sanitizeIntegerInput = (value) => String(value).replace(/[^0-9]/g, "");

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 101 }, (_, index) => currentYear - index);
};

const getDobFromAge = (age) => {
  const today = new Date();
  return new Date(today.getFullYear() - (Number(age) || 22), today.getMonth(), today.getDate());
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

const heightCmToFeetInches = (heightCm) => {
  const totalInches = (Number(heightCm) || 0) / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);

  return inches === 12 ? { feet: feet + 1, inches: 0 } : { feet, inches };
};

const formatHeightFeetInches = (heightCm) => {
  const { feet, inches } = heightCmToFeetInches(heightCm);
  return feet > 0 ? `${feet} ft ${inches} in` : "";
};

const feetInchesToCm = (feet, inches) => Math.round(((Number(feet) || 0) * 12 + (Number(inches) || 0)) * 2.54);

const getHeightFormFromCm = (heightCm) => {
  const { feet, inches } = heightCmToFeetInches(heightCm);
  return {
    heightFeet: feet ? String(feet) : "",
    heightInches: String(inches || "")
  };
};

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
  const { profile, currentUser, updateProfile, themeMode, toggleTheme, logout, isDark } = useApp();
  const [editing, setEditing] = useState(false);
  const displayHeight = formatHeightFeetInches(profile.heightCm);
  const email = profile.email || currentUser?.email || currentUser?.user?.email || "";
  const yearOptions = useMemo(() => getYearOptions(), []);
  const [selectedDob, setSelectedDob] = useState(() => getDobFromAge(profile.age));
  const [heightParts, setHeightParts] = useState(() => getHeightFormFromCm(profile.heightCm));
  const dayOptions = useMemo(
    () =>
      Array.from({ length: getDaysInMonth(selectedDob.getFullYear(), selectedDob.getMonth()) }, (_, index) => index + 1),
    [selectedDob]
  );
  const [form, setForm] = useState({
    name: profile.name,
    goal: profile.goal,
    gender: profile.gender,
    weightKg: String(profile.weightKg),
    activity: profile.activity
  });

  useEffect(() => {
    console.log("[ProfileScreen] profile/user", { profile, currentUser });
  }, []);

  useEffect(() => {
    if (!editing) {
      setForm({
        name: profile.name,
        goal: profile.goal,
        gender: profile.gender,
        weightKg: String(profile.weightKg),
        activity: profile.activity
      });
      setSelectedDob(getDobFromAge(profile.age));
      setHeightParts(getHeightFormFromCm(profile.heightCm));
    }
  }, [editing, profile]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateDob = ({ year = selectedDob.getFullYear(), month = selectedDob.getMonth(), day = selectedDob.getDate() }) => {
    const safeDay = Math.min(day, getDaysInMonth(year, month));
    setSelectedDob(clampDob(new Date(year, month, safeDay)));
  };

  const updateHeightFeet = (value) => {
    setHeightParts((current) => ({ ...current, heightFeet: sanitizeIntegerInput(value) }));
  };

  const updateHeightInches = (value) => {
    const sanitized = sanitizeIntegerInput(value);
    setHeightParts((current) => ({
      ...current,
      heightInches: sanitized ? String(Math.min(Number(sanitized), 11)) : ""
    }));
  };

  const saveProfile = async () => {
    const nextHeightCm = feetInchesToCm(heightParts.heightFeet, heightParts.heightInches);
    try {
      await updateProfile({
        ...form,
        age: calculateAgeFromDob(selectedDob) || profile.age,
        heightCm: nextHeightCm || profile.heightCm,
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
        <AppHeader title="Me" dark={isDark} />

        <ClayCard dark={isDark}>
          <View className="items-center">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-[32px] bg-mint-100">
              <Ionicons name="person" size={42} color={colors.primaryDark} />
            </View>
            <Text className={`text-2xl font-black ${isDark ? "text-white" : "text-ink"}`}>{profile.name}</Text>
            {email ? (
              <Text className={`mt-1 text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
                {email}
              </Text>
            ) : null}
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
              <ProfileRow icon="location-outline" label="District:" value={profile.district || "Not set"} dark={isDark} />
              <ProfileRow icon="calendar-outline" label="Age" value={`${profile.age} years`} dark={isDark} />
              <ProfileRow icon="resize-outline" label="Height" value={displayHeight} dark={isDark} />
              <ProfileRow icon="barbell-outline" label="Weight" value={`${profile.weightKg} kg`} dark={isDark} />
              {/* <ProfileRow icon="walk-outline" label="Activity" value={titleCase(profile.activity)} dark={isDark} /> */}
            </View>
          ) : (
            <View>
              <EditInput label="Name" value={form.name} onChangeText={(value) => updateField("name", value)} dark={isDark} />
              <View className="mb-4">
                <Text className={`mb-2 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Date of Birth</Text>
                <View className={`rounded-[22px] p-4 ${isDark ? "bg-white/5" : "bg-sage-50"}`}>
                  <Text className={`text-lg font-black ${isDark ? "text-white" : "text-ink"}`}>{formatDob(selectedDob)}</Text>
                  <Text className={`mt-1 text-sm font-bold ${isDark ? "text-white/60" : "text-cocoa"}`}>
                    {calculateAgeFromDob(selectedDob)} years
                  </Text>
                </View>

                <Text className={`mb-2 mt-4 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Month</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 pr-4">
                    {monthOptions.map((month) => {
                      const selected = selectedDob.getMonth() === month.value;
                      return (
                        <Pressable
                          key={month.value}
                          onPress={() => updateDob({ month: month.value })}
                          className="h-10 items-center justify-center rounded-full px-4"
                          style={{ backgroundColor: selected ? colors.primary : isDark ? "rgba(255,255,255,0.06)" : "#F3F8EF" }}
                        >
                          <Text className={`font-black ${selected ? "text-white" : isDark ? "text-white" : "text-ink"}`}>
                            {month.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                <Text className={`mb-2 mt-4 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Day</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 pr-4">
                    {dayOptions.map((day) => {
                      const selected = selectedDob.getDate() === day;
                      return (
                        <Pressable
                          key={day}
                          onPress={() => updateDob({ day })}
                          className="h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: selected ? colors.primary : isDark ? "rgba(255,255,255,0.06)" : "#F3F8EF" }}
                        >
                          <Text className={`font-black ${selected ? "text-white" : isDark ? "text-white" : "text-ink"}`}>{day}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                <Text className={`mb-2 mt-4 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Year</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 pr-4">
                    {yearOptions.map((year) => {
                      const selected = selectedDob.getFullYear() === year;
                      return (
                        <Pressable
                          key={year}
                          onPress={() => updateDob({ year })}
                          className="h-10 items-center justify-center rounded-full px-4"
                          style={{ backgroundColor: selected ? colors.primary : isDark ? "rgba(255,255,255,0.06)" : "#F3F8EF" }}
                        >
                          <Text className={`font-black ${selected ? "text-white" : isDark ? "text-white" : "text-ink"}`}>{year}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
              <View className="mb-4">
                <Text className={`mb-2 text-sm font-bold ${isDark ? "text-white/70" : "text-cocoa"}`}>Height</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextInput
                      value={heightParts.heightFeet}
                      onChangeText={updateHeightFeet}
                      keyboardType="number-pad"
                      maxLength={2}
                      className={`h-14 rounded-[24px] px-5 text-base font-bold ${isDark ? "bg-white/5 text-white" : "bg-sage-50 text-ink"}`}
                      placeholder="Feet"
                      placeholderTextColor="#A09689"
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      value={heightParts.heightInches}
                      onChangeText={updateHeightInches}
                      keyboardType="number-pad"
                      maxLength={2}
                      className={`h-14 rounded-[24px] px-5 text-base font-bold ${isDark ? "bg-white/5 text-white" : "bg-sage-50 text-ink"}`}
                      placeholder="Inches"
                      placeholderTextColor="#A09689"
                    />
                  </View>
                </View>
              </View>
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
