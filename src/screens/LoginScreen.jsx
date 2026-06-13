import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { login } from "../utils/auth";

import ClayCard from "../components/ClayCard";
import PrimaryButton from "../components/PrimaryButton";
import { useApp } from "../utils/appState";

export default function LoginScreen({ navigation }) {
  const { completeAuth } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await login({ email, password });

      if (data.access) {
        await completeAuth();
        return;
      }

      Alert.alert("Login failed", data.detail || "Invalid credentials");
    } catch (error) {
      Alert.alert("Login failed", "Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#F3F8EF", "#FFF8EA"]} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 pt-16">
        <View className="mb-10">
          <Text className="text-4xl font-black text-ink">Welcome back</Text>
          <Text className="mt-3 text-base leading-6 text-cocoa">
            Continue your food log, macro balance, and daily calorie streak.
          </Text>
        </View>

        <ClayCard>
          <Text className="mb-2 text-sm font-bold text-cocoa">Email</Text>
          <TextInput
            placeholder="Enter Your Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            className="mb-4 h-14 rounded-3xl bg-sage-50 px-5 text-base text-ink"
            placeholderTextColor="#A09689"
          />

          <Text className="mb-2 text-sm font-bold text-cocoa">Password</Text>
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="mb-6 h-14 rounded-3xl bg-sage-50 px-5 text-base text-ink"
            placeholderTextColor="#A09689"
          />

          <PrimaryButton
            title={loading ? "Logging In" : "Log In"}
            icon="log-in-outline"
            onPress={handleLogin}
            disabled={loading}
          />
          <PrimaryButton
            title="Create Account"
            variant="soft"
            icon="person-add-outline"
            onPress={() => navigation.navigate("Signup")}
            className="mt-3"
          />
        </ClayCard>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
