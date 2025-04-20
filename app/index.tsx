"use client"

import { useEffect } from "react"
import { StyleSheet, View, Text, Image, TouchableOpacity, Platform } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"
import * as Haptics from "expo-haptics"

export default function LandingScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useAuth()

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      router.replace("/(tabs)")
    }
  }, [user, router])

  const handleContinue = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    router.push("/(auth)/login")
  }

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.logoContainer}>
            <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(800)}>
            <Text style={[styles.title, { color: theme.colors.white }]}>Smart City Assistant</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(800)}>
            <Text style={[styles.subtitle, { color: theme.colors.white }]}>
              Helping elderly and disabled persons navigate daily life with ease
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(900).duration(800)} style={styles.featureContainer}>
            <FeatureItem icon="heart" text="Health Tracking" theme={theme} />
            <FeatureItem icon="coffee" text="Food Monitoring" theme={theme} />
            <FeatureItem icon="map-pin" text="Nearby Services" theme={theme} />
            <FeatureItem icon="file-text" text="Medical Reports" theme={theme} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(1100).duration(800)} style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.white }]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Get Started</Text>
              <Feather name="arrow-right" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const FeatureItem = ({ icon, text, theme }) => (
  <View style={styles.featureItem}>
    <View style={[styles.iconContainer, { backgroundColor: theme.colors.white }]}>
      <Feather name={icon} size={24} color={theme.colors.primary} />
    </View>
    <Text style={[styles.featureText, { color: theme.colors.white }]}>{text}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontFamily: "Inter-Bold",
    marginBottom: 16,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 48,
    opacity: 0.9,
    maxWidth: "85%",
  },
  featureContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 48,
    width: "100%",
  },
  featureItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 28,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  featureText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginRight: 8,
  },
})
