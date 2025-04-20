"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { Feather } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { uploadToCloudinary } from "@/utils/cloudinary"
import * as Haptics from "expo-haptics"

export default function EditProfileScreen() {
  const router = useRouter()
  const { theme, getFontSize } = useTheme()
  const { user, updateProfile } = useAuth()

  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    age: "",
    address: "",
    city: "",
    pincode: "",
    description: "",
    profileImage: null,
  })
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        age: user.age ? user.age.toString() : "",
        address: user.address || "",
        city: user.city || "",
        pincode: user.pincode || "",
        description: user.description || "",
        profileImage: user.profileImage || null,
      })
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value,
    })
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
        setImageUploading(true)
        try {
          const imageUrl = await uploadToCloudinary(result.assets[0].uri)
          setProfileData({
            ...profileData,
            profileImage: imageUrl,
          })
        } catch (error) {
          console.error("Error uploading image:", error)
          Alert.alert("Error", "Failed to upload image. Please try again.")
        } finally {
          setImageUploading(false)
        }
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) {
      Alert.alert("Error", "Name is required")
      return
    }

    try {
      setLoading(true)

      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Convert age to number if provided
      const updatedData = {
        ...profileData,
        age: profileData.age ? Number.parseInt(profileData.age) : null,
      }

      await updateProfile(updatedData)
      Alert.alert("Success", "Profile updated successfully")
      router.back()
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", "Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage} disabled={imageUploading}>
            {imageUploading ? (
              <View style={[styles.profileImage, { backgroundColor: theme.colors.border }]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : profileData.profileImage ? (
              <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: theme.colors.border }]}>
                <Feather name="user" size={40} color={theme.colors.textSecondary} />
              </View>
            )}
            <View style={[styles.editImageButton, { backgroundColor: theme.colors.primary }]}>
              <Feather name="camera" size={16} color={theme.colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.changePhotoText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
            Change Profile Photo
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
              Full Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
              ]}
              placeholder="Your Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={profileData.name}
              onChangeText={(text) => handleInputChange("name", text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>Age</Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
              ]}
              placeholder="Your Age"
              placeholderTextColor={theme.colors.textSecondary}
              value={profileData.age}
              onChangeText={(text) => handleInputChange("age", text)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>Address</Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
              ]}
              placeholder="Your Address"
              placeholderTextColor={theme.colors.textSecondary}
              value={profileData.address}
              onChangeText={(text) => handleInputChange("address", text)}
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>City</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
                ]}
                placeholder="City"
                placeholderTextColor={theme.colors.textSecondary}
                value={profileData.city}
                onChangeText={(text) => handleInputChange("city", text)}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>Pincode</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
                ]}
                placeholder="Pincode"
                placeholderTextColor={theme.colors.textSecondary}
                value={profileData.pincode}
                onChangeText={(text) => handleInputChange("pincode", text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
              About Me (Optional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
              ]}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.colors.textSecondary}
              value={profileData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.colors.white, fontSize: getFontSize(18) }]}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: "Inter-Bold",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: {
    fontFamily: "Inter-Medium",
  },
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Inter-Medium",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: "Inter-Regular",
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontFamily: "Inter-Regular",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontFamily: "Inter-Bold",
  },
})
