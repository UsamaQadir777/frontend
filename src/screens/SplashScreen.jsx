import React, { useEffect } from "react";
import { login, signup, logout } from "../utils/auth";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import PrimaryButton from "../components/PrimaryButton";
import { useApp } from "../utils/appState";


export default function SplashScreen() {
  const { completeSplash } = useApp();

  useEffect(() => {
    const timer = setTimeout(completeSplash, 3200); // Auto-navigate after 3.2s
    return () => clearTimeout(timer);
  }, [completeSplash]);

  return (
    <LinearGradient
      colors={["#FF7F50", "#FFD700"]} // Orange to yellow gradient
      style={styles.container}
    >
      {/* Centered Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={styles.appTitle}>Calories Counter</Text>
        <Text style={styles.tagline}>
          Track. Eat. Live Healthy.
        </Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </View>

      {/* Optional Button for manual start */}
      <PrimaryButton
        title="Get Started"
        icon="arrow-forward"
        onPress={completeSplash}
        style={styles.button}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
  tagline: {
    marginTop: 10,
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  loader: {
    marginTop: 30,
  },
  button: {
    marginTop: 40,
    width: "60%",
  },
});