import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import PrimaryButton from "../components/PrimaryButton";
import { useApp } from "../utils/appState";

const logoImage = require("../assets/images/logo.png");

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
        <Image source={logoImage} style={styles.logoImage} resizeMode="cover" />
        <Text style={styles.appTitle}>Desi Track</Text>
        <Text style={styles.tagline}>
          Track Desi. Live Healthy.
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
    justifyContent: "center",
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
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
    marginBottom: 30,
  },
  button: {
    marginTop: 40,
    width: "60%",
  },
});
