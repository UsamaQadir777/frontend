import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import ClayCard from "../components/ClayCard";
import PrimaryButton from "../components/PrimaryButton";
import { useApp } from "../utils/appState";
import { login, signup } from "../utils/auth";

export default function SignupScreen({ navigation }) {
  const { completeAuth } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const signupData = await signup({ email, password, name });

      if (signupData.detail || signupData.error) {
        Alert.alert("Signup failed", signupData.detail || signupData.error);
        return;
      }

      const loginData = await login({ email, password });
      if (loginData.access) {
        await completeAuth();
        return;
      }

      Alert.alert("Signup complete", "Please log in with your new account.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Signup failed", "Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#F3F8EF", "#FFF8EA"]} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 pt-16">
        <View className="mb-10">
          <Text className="text-4xl font-black text-ink">Create account</Text>
          <Text className="mt-3 text-base leading-6 text-cocoa">
            Your first login will open a short setup so we can estimate your daily targets.
          </Text>
        </View>

        <ClayCard>
          <Text className="mb-2 text-sm font-bold text-cocoa">Name</Text>
          <TextInput
            placeholder="Enter Your Name"
            value={name}
            onChangeText={setName}
            className="mb-4 h-14 rounded-3xl bg-sage-50 px-5 text-base text-ink"
            placeholderTextColor="#A09689"
          />

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
            title={loading ? "Creating Account" : "Sign Up"}
            icon="sparkles-outline"
            onPress={handleSignup}
            disabled={loading}
          />
          <PrimaryButton
            title="Already have an account? Login"
            variant="ghost"
            onPress={() => navigation.navigate("Login")}
            className="mt-3"
          />
        </ClayCard>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
