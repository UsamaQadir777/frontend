import { useEffect, useMemo, useState } from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { dummyMeals } from "../data/dummyMeals";
import OnboardingScreen from "../screens/OnboardingScreen";
import SplashScreen from "../screens/SplashScreen";
import { logout as logoutApi } from "../utils/auth";
import { getAccessToken, getRefreshToken, setAuthFailureHandler } from "../utils/apiClient";
import { AppContext } from "../utils/appState";
import { mergeProfileWithTargets } from "../utils/calorieCalculator";
import { fetchProfile, normalizeProfileFromApi, toProfilePayload, updateProfile as updateProfileApi } from "../utils/profile";
import AuthNavigator from "./AuthNavigator";
import BottomTabs from "./BottomTabs";

const Stack = createNativeStackNavigator();

const defaultProfile = mergeProfileWithTargets({
  name: "Hadia",
  goal: "lose weight",
  age: 22,
  gender: "Female",
  heightCm: 165,
  weightKg: 70,
  activity: "normal walk"
});

const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F3F8EF",
    card: "#FFFDF7",
    primary: "#46A756"
  }
};

const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#14231B",
    card: "#203328",
    primary: "#74D99A"
  }
};

export default function AppNavigator() {
  const [splashDone, setSplashDone] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [checkingStoredSession, setCheckingStoredSession] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);
  const [meals, setMeals] = useState(dummyMeals);
  const [themeMode, setThemeMode] = useState("light");

  const isDark = themeMode === "dark";

  console.log("[AppNavigator] render", {
    splashDone,
    isAuthenticated,
    hasOnboarded,
    checkingStoredSession
  });

  const clearSession = () => {
    setIsAuthenticated(false);
    setHasOnboarded(false);
    setProfile(defaultProfile);
  };

  const loadAuthenticatedProfile = async () => {
    const data = await fetchProfile();
    const nextProfile = normalizeProfileFromApi(data);

    setProfile(mergeProfileWithTargets(nextProfile));
    setHasOnboarded(nextProfile.onboardingCompleted);
    setIsAuthenticated(true);
    return nextProfile;
  };

  useEffect(() => {
    console.log("[AppNavigator] auth failure handler registered");
    setAuthFailureHandler(clearSession);
    return () => {
      console.log("[AppNavigator] auth failure handler cleared");
      setAuthFailureHandler(null);
    };
  }, []);

  useEffect(() => {
    const restoreStoredSession = async () => {
      console.log("[AppNavigator] restoreStoredSession check", {
        splashDone,
        isAuthenticated
      });

      if (!splashDone || isAuthenticated) return;

      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();

      console.log("[AppNavigator] stored token check", {
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken)
      });

      if (!accessToken && !refreshToken) return;

      setCheckingStoredSession(true);
      try {
        console.log("[AppNavigator] restoring stored session:start");
        await loadAuthenticatedProfile();
        console.log("[AppNavigator] restoring stored session:success");
      } catch (error) {
        console.error("[AppNavigator] restoring stored session:error", error);
        clearSession();
      } finally {
        setCheckingStoredSession(false);
        console.log("[AppNavigator] restoring stored session:finished");
      }
    };

    restoreStoredSession();
  }, [splashDone, isAuthenticated]);

  const value = useMemo(
    () => ({
      profile,
      meals,
      themeMode,
      isDark,
      completeSplash: () => {
        console.log("[AppNavigator] completeSplash");
        setSplashDone(true);
      },
      completeAuth: loadAuthenticatedProfile,
      completeOnboarding: async (nextProfile) => {
        const payload = toProfilePayload({ ...nextProfile, onboardingCompleted: true });
        const data = await updateProfileApi(payload);
        const savedProfile = normalizeProfileFromApi({ ...nextProfile, ...data, onboarding_completed: true });

        setProfile(mergeProfileWithTargets(savedProfile));
        setHasOnboarded(true);
      },
      updateProfile: async (updates) => {
        const data = await updateProfileApi(toProfilePayload(updates));
        setProfile((currentProfile) => {
          const savedProfile = normalizeProfileFromApi({ ...currentProfile, ...updates, ...data });
          return mergeProfileWithTargets(savedProfile);
        });
      },
      addFoodToMeal: (mealId, food) => {
        setMeals((currentMeals) =>
          currentMeals.map((meal) =>
            meal.id === mealId
              ? {
                  ...meal,
                  foods: [food, ...meal.foods]
                }
              : meal
          )
        );
      },
      toggleTheme: () => setThemeMode((mode) => (mode === "light" ? "dark" : "light")),
      logout: async () => {
        await logoutApi();
        clearSession();
      }
    }),
    [isDark, meals, profile, themeMode]
  );

  return (
    <AppContext.Provider value={value}>
      <NavigationContainer theme={isDark ? darkNavigationTheme : lightNavigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!splashDone || checkingStoredSession ? (
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : !isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : !hasOnboarded ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : (
            <Stack.Screen name="MainTabs" component={BottomTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
}
