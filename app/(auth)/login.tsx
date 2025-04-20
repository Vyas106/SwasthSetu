"use client"

import { useState, useRef } from "react"
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, Platform } from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeInDown } from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { StatusBar } from "expo-status-bar"

export default function LoginScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { login } = useAuth()

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [nameError, setNameError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const passwordRef = useRef(null)

  const validateInputs = () => {
    let isValid = true

    if (!name.trim()) {
      setNameError("Please enter your name")
      isValid = false
    } else {
      setNameError("")
    }

    if (!password.trim()) {
      setPasswordError("Please enter your password")
      isValid = false
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      isValid = false
    } else {
      setPasswordError("")
    }

    return isValid
  }

  const handleLogin = async () => {
    if (!validateInputs()) return

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }

    setIsLoading(true)
    try {
      await login(name, password)
      router.replace("/(tabs)")
    } catch (error) {
      Alert.alert("Login Failed", error.message || "Please check your credentials and try again")
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToSignup = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    router.push("/(auth)/signup")
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(200).duration(700)} style={styles.header}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Login to continue using Smart City Assistant
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(700)} style={styles.form}>
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: nameError ? theme.colors.danger : theme.colors.border },
                name.length > 0 && { borderColor: theme.colors.primary },
              ]}
            >
              <Feather
                name="user"
                size={20}
                color={
                  nameError ? theme.colors.danger : name.length > 0 ? theme.colors.primary : theme.colors.textSecondary
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Your Name"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text)
                  if (text.trim()) setNameError("")
                }}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            {nameError ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{nameError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: passwordError ? theme.colors.danger : theme.colors.border },
                password.length > 0 && { borderColor: theme.colors.primary },
              ]}
            >
              <Feather
                name="lock"
                size={20}
                color={
                  passwordError
                    ? theme.colors.danger
                    : password.length > 0
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                }
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (text.trim() && text.length >= 6) setPasswordError("")
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{passwordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingDot} />
                <View style={[styles.loadingDot, { animationDelay: "0.2s" }]} />
                <View style={[styles.loadingDot, { animationDelay: "0.4s" }]} />
              </View>
            ) : (
              <Text style={[styles.buttonText, { color: theme.colors.white }]}>Login</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(700)} style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Don't have an account?</Text>
          <TouchableOpacity onPress={navigateToSignup}>
            <Text style={[styles.footerLink, { color: theme.colors.primary }]}>Create Account</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    maxWidth: "80%",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 8,
    fontFamily: "Inter-Regular",
    fontSize: 16,
  },
  passwordToggle: {
    padding: 12,
  },
  errorText: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
    marginHorizontal: 2,
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    marginRight: 4,
  },
  footerLink: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
})
