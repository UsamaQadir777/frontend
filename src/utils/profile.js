import { apiFetch } from "./apiClient";

const GOAL_TO_API = {
  weight_loss: "lose",
  weight_gain: "gain",
  maintenance: "maintain",
  "lose weight": "lose",
  "gain weight": "gain",
  "maintain weight": "maintain",
  lose: "lose",
  gain: "gain",
  maintain: "maintain",
};

const GOAL_FROM_API = {
  weight_loss: "lose weight",
  weight_gain: "gain weight",
  maintenance: "maintain weight",
  lose: "lose weight",
  gain: "gain weight",
  maintain: "maintain weight",
};

const GENDER_TO_API = {
  male: "male",
  female: "female",
  other: "other",
};

const GENDER_FROM_API = {
  male: "Male",
  female: "Female",
  other: "Other",
};

const ACTIVITY_TO_API = {
  "no activity": "no_activity",
  "normal walk": "normal_walk",
  "gym/light active": "light_active",
  "very active": "very_active",
  no_activity: "no_activity",
  normal_walk: "normal_walk",
  light_active: "light_active",
  very_active: "very_active",
};

const ACTIVITY_FROM_API = {
  no_activity: "no activity",
  normal_walk: "normal walk",
  light_active: "gym/light active",
  very_active: "very active",
};

const normalizeChoiceKey = (value) => String(value || "").trim().toLowerCase();

const mapChoice = (value, mapping, fallback) => {
  const key = normalizeChoiceKey(value);
  return mapping[key] || value || fallback;
};

export const profileChoicesToApi = {
  goal: (value) => mapChoice(value, GOAL_TO_API, "maintain"),
  gender: (value) => mapChoice(value, GENDER_TO_API, "other"),
  activity: (value) => mapChoice(value, ACTIVITY_TO_API, "normal_walk"),
};

const profileChoicesFromApi = {
  goal: (value) => mapChoice(value, GOAL_FROM_API, "lose weight"),
  gender: (value) => mapChoice(value, GENDER_FROM_API, "Female"),
  activity: (value) => mapChoice(value, ACTIVITY_FROM_API, "normal walk"),
};

export function normalizeProfileFromApi(data = {}, userData = {}) {
  const user = data.user || userData.user || userData || {};
  const profileData = data.profile || data;

  return {
    name: profileData.name || user.name || user.username || "Friend",
    email: profileData.email || user.email || "",
    district: profileData.district || "",
    goal: profileChoicesFromApi.goal(profileData.goal),
    age: Number(profileData.age) || 22,
    gender: profileChoicesFromApi.gender(profileData.gender),
    heightCm: Number(profileData.heightCm ?? profileData.height_cm ?? profileData.height) || 165,
    weightKg: Number(profileData.weightKg ?? profileData.weight_kg ?? profileData.current_weight ?? profileData.weight) || 70,
    activity: profileChoicesFromApi.activity(profileData.activity || profileData.activity_level),
    onboardingCompleted: Boolean(profileData.onboarding_completed ?? profileData.onboardingCompleted),
  };
}

export function toProfilePayload(profile = {}) {
  return {
    ...(profile.name !== undefined ? { name: profile.name } : {}),
    ...(profile.district !== undefined ? { district: profile.district || null } : {}),
    ...(profile.goal !== undefined ? { goal: profileChoicesToApi.goal(profile.goal) } : {}),
    ...(profile.age !== undefined ? { age: profile.age } : {}),
    ...(profile.gender !== undefined ? { gender: profileChoicesToApi.gender(profile.gender) } : {}),
    ...(profile.heightCm !== undefined ? { height: profile.heightCm } : {}),
    ...(profile.weightKg !== undefined ? { current_weight: profile.weightKg } : {}),
    ...(profile.activity !== undefined ? { activity_level: profileChoicesToApi.activity(profile.activity) } : {}),
    ...(profile.onboardingCompleted !== undefined ? { onboarding_completed: profile.onboardingCompleted } : {}),
  };
}

// Fetch profile
export async function fetchProfile() {
  const res = await apiFetch("/profile/", { method: "GET" });
  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }

  return res.json();
}

export async function fetchCurrentUser() {
  const res = await apiFetch("/auth/me/", { method: "GET" });
  if (!res.ok) {
    throw new Error("Failed to fetch current user");
  }

  return res.json();
}

// Update profile / Onboarding
export async function updateProfile(data) {
  const res = await apiFetch("/profile/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update profile");
  }

  return res.json();
}
