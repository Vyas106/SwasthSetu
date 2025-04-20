"use client"

import { useState, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { Feather } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { uploadToCloudinary } from "@/utils/cloudinary"
import Animated, { FadeInDown } from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { StatusBar } from "expo-status-bar"

export default function SignupScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { signup } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    address: "",
    city: "",
    pincode: "",
    description: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [profileImage, setProfileImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Refs for input fields
  const ageRef = useRef(null)
  const addressRef = useRef(null)
  const cityRef = useRef(null)
  const pincodeRef = useRef(null)
  const descriptionRef = useRef(null)
  const passwordRef = useRef(null)
  const confirmPasswordRef = useRef(null)

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    })

    // Clear error when user types
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: "",
      })
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant permission to access your media library")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        if (Platform.OS === "ios") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }
        setUploadingImage(true)
        setProfileImage(result.assets[0].uri)
        setUploadingImage(false)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
      setUploadingImage(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (formData.age && isNaN(Number(formData.age))) {
      newErrors.age = "Age must be a number"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async () => {
    if (!validateForm()) return

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }

    setIsLoading(true)
    try {
      let profileImageUrl = null

      if (profileImage) {
        profileImageUrl = await uploadToCloudinary(profileImage)
      }

      const userData = {
        name: formData.name,
        age: formData.age ? Number.parseInt(formData.age) : null,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        description: formData.description,
        profileImage: profileImageUrl,
      }

      await signup(userData, formData.password)
      router.replace("/(tabs)")
    } catch (error) {
      Alert.alert("Signup Failed", error.message || "An error occurred during signup")
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToLogin = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    router.push("/(auth)/login")
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.delay(200).duration(700)} style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Sign up to start using Smart City Assistant
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.form}>
            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={pickImage}
              disabled={uploadingImage}
              activeOpacity={0.8}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View
                  style={[
                    styles.imagePlaceholder,
                    { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border },
                  ]}
                >
                  <Feather name="camera" size={32} color={theme.colors.primary} />
                  <Text style={[styles.imagePlaceholderText, { color: theme.colors.primary }]}>
                    Add Photo (Optional)
                  </Text>
                </View>
              )}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <Feather name="loader" size={24} color={theme.colors.white} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: errors.name ? theme.colors.danger : theme.colors.border },
                  formData.name.length > 0 && !errors.name && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="user"
                  size={20}
                  color={
                    errors.name
                      ? theme.colors.danger
                      : formData.name.length > 0
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Full Name *"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                  returnKeyType="next"
                  onSubmitEditing={() => ageRef.current?.focus()}
                />
              </View>
              {errors.name ? (
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.name}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: errors.age ? theme.colors.danger : theme.colors.border },
                  formData.age.length > 0 && !errors.age && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="calendar"
                  size={20}
                  color={
                    errors.age
                      ? theme.colors.danger
                      : formData.age.length > 0
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={ageRef}
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Age"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.age}
                  onChangeText={(text) => handleInputChange("age", text)}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => addressRef.current?.focus()}
                />
              </View>
              {errors.age ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.age}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: errors.address ? theme.colors.danger : theme.colors.border },
                  formData.address.length > 0 && !errors.address && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="home"
                  size={20}
                  color={
                    errors.address
                      ? theme.colors.danger
                      : formData.address.length > 0
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={addressRef}
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Home Address"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.address}
                  onChangeText={(text) => handleInputChange("address", text)}
                  returnKeyType="next"
                  onSubmitEditing={() => cityRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: errors.city ? theme.colors.danger : theme.colors.border },
                    formData.city.length > 0 && !errors.city && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Feather
                    name="map-pin"
                    size={20}
                    color={
                      errors.city
                        ? theme.colors.danger
                        : formData.city.length > 0
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={cityRef}
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="City"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.city}
                    onChangeText={(text) => handleInputChange("city", text)}
                    returnKeyType="next"
                    onSubmitEditing={() => pincodeRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: errors.pincode ? theme.colors.danger : theme.colors.border },
                    formData.pincode.length > 0 && !errors.pincode && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Feather
                    name="hash"
                    size={20}
                    color={
                      errors.pincode
                        ? theme.colors.danger
                        : formData.pincode.length > 0
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={pincodeRef}
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Pincode"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.pincode}
                    onChangeText={(text) => handleInputChange("pincode", text)}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => descriptionRef.current?.focus()}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.textAreaWrapper,
                  { borderColor: errors.description ? theme.colors.danger : theme.colors.border },
                  formData.description.length > 0 && !errors.description && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="file-text"
                  size={20}
                  color={
                    errors.description
                      ? theme.colors.danger
                      : formData.description.length > 0
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                  }
                  style={[styles.inputIcon, { marginTop: 16 }]}
                />
                <TextInput
                  ref={descriptionRef}
                  style={[styles.textArea, { color: theme.colors.text }]}
                  placeholder="Description (Optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.description}
                  onChangeText={(text) => handleInputChange("description", text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: errors.password ? theme.colors.danger : theme.colors.border },
                  formData.password.length > 0 && !errors.password && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="lock"
                  size={20}
                  color={
                    errors.password
                      ? theme.colors.danger
                      : formData.password.length > 0
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Password *"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange("password", text)}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.password}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: errors.confirmPassword ? theme.colors.danger : theme.colors.border },
                  formData.confirmPassword.length > 0 &&
                    !errors.confirmPassword && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="check-circle"
                  size={20}
                  color={
                    errors.confirmPassword
                      ? theme.colors.danger
                      : formData.confirmPassword.length > 0
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmPasswordRef}
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Confirm Password *"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange("confirmPassword", text)}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleSignup}
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
                <Text style={[styles.buttonText, { color: theme.colors.white }]}>Create Account</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(700)} style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Already have an account?</Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 32,
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
  imagePickerContainer: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginTop: 8,
    textAlign: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  textAreaWrapper: {
    flexDirection: "row",
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
  textArea: {
    flex: 1,
    height: 100,
    paddingHorizontal: 8,
    paddingTop: 16,
    fontFamily: "Inter-Regular",
    fontSize: 16,
    textAlignVertical: "top",
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
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
    marginTop: 16,
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
