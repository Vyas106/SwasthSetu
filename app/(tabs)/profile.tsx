"use client"

import { useState, useCallback, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
  Switch,
  Modal,
  TextInput,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import * as Speech from "expo-speech"
import type { EmergencyContact } from "@/types"
import {
  updateUserSettings,
  fetchEmergencyContacts,
  saveEmergencyContact,
  deleteEmergencyContact,
} from "@/services/firebase"
import { useFocusEffect } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"
import { BlurView } from "expo-blur"
import { Platform } from "react-native"
import { LanguageSelector } from "@/components/profile/LanguageSelector"

// Import other profile components as needed

export default function ProfileScreen() {
  const { theme, toggleTheme, increaseFontSize, decreaseFontSize, resetFontSize, fontSizeScale, getFontSize } =
    useTheme()
  const { language } = useLanguage()
  const { user, logout } = useAuth()
  const router = useRouter()

  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [medicalHistory, setMedicalHistory] = useState({
    conditions: [] as string[],
    allergies: [] as string[],
    medications: [] as string[],
  })
  const [contactModalVisible, setContactModalVisible] = useState(false)
  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: "",
  })
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [200, 80],
    extrapolate: "clamp",
  })
  const imageSize = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [80, 40],
    extrapolate: "clamp",
  })
  const imageMarginTop = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 20],
    extrapolate: "clamp",
  })
  const headerInfoOpacity = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  })
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  })

  const loadEmergencyContacts = useCallback(async () => {
    if (user) {
      try {
        setLoading(true)
        const contacts = await fetchEmergencyContacts(user.id)
        setEmergencyContacts(contacts)
        setLoading(false)
      } catch (error) {
        console.error("Error loading emergency contacts:", error)
        setLoading(false)
      }
    }
  }, [user])

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEmergencyContacts()

      // Load medical history from user data if available
      if (user && user.medicalHistory) {
        setMedicalHistory(user.medicalHistory)
      }

      // Load voice setting
      const loadVoiceSetting = async () => {
        try {
          const settings = await AsyncStorage.getItem("userSettings")
          if (settings) {
            const parsedSettings = JSON.parse(settings)
            setVoiceEnabled(parsedSettings.voiceEnabled || false)
          }
        } catch (error) {
          console.error("Error loading voice settings:", error)
        }
      }

      loadVoiceSetting()
    }, [loadEmergencyContacts, user]),
  )

  const handleVoiceToggle = async () => {
    try {
      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const newValue = !voiceEnabled
      setVoiceEnabled(newValue)

      if (user) {
        await updateUserSettings(user.id, { voiceEnabled: newValue })

        // Save to AsyncStorage for quick access
        await AsyncStorage.setItem("userSettings", JSON.stringify({ voiceEnabled: newValue }))

        if (newValue) {
          Speech.speak("Voice reading is now enabled")
        }
      }
    } catch (error) {
      console.error("Error updating voice settings:", error)
      Alert.alert("Error", "Failed to update voice settings")
    }
  }

  const handleEmergencyCall = (phone: string) => {
    // Provide haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    Linking.openURL(`tel:${phone}`)
  }

  const handleAddContact = async () => {
    // Validate input
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      Alert.alert("Error", "Name and phone number are required")
      return
    }

    try {
      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      if (user) {
        const savedContact = await saveEmergencyContact(user.id, newContact)
        setEmergencyContacts([...emergencyContacts, savedContact])
        setContactModalVisible(false)
        setNewContact({ name: "", relationship: "", phone: "" })
      }
    } catch (error) {
      console.error("Error adding emergency contact:", error)
      Alert.alert("Error", "Failed to add emergency contact. Please try again.")
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      if (user) {
        Alert.alert("Delete Contact", "Are you sure you want to delete this emergency contact?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              // Provide haptic feedback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

              await deleteEmergencyContact(user.id, contactId)
              setEmergencyContacts(emergencyContacts.filter((contact) => contact.id !== contactId))
            },
          },
        ])
      }
    } catch (error) {
      console.error("Error deleting emergency contact:", error)
      Alert.alert("Error", "Failed to delete emergency contact. Please try again.")
    }
  }

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Provide haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

            await logout()
          } catch (error) {
            console.error("Error logging out:", error)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["left", "right"]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            height: headerHeight,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Animated.View style={[styles.headerContent, { opacity: headerInfoOpacity }]}>
          <Animated.Image
            source={user?.profileImage ? { uri: user.profileImage } : require("@/assets/images/default-avatar.png")}
            style={[
              styles.profileImage,
              {
                width: imageSize,
                height: imageSize,
                marginTop: imageMarginTop,
              },
            ]}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text, fontSize: getFontSize(24) }]}>
              {user?.name || "User"}
            </Text>
            <Text style={[styles.profileAge, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
              {user?.age ? `${user.age} years old` : "Age not specified"}
            </Text>
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.text,
              opacity: headerTitleOpacity,
              fontSize: getFontSize(18),
            },
          ]}
        >
          My Profile
        </Animated.Text>

        <TouchableOpacity
          style={[styles.editProfileButton, { backgroundColor: theme.colors.primaryLight }]}
          onPress={() => router.push("/profile/edit")}
        >
          <Feather name="edit-2" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Address Info */}
        <View style={[styles.addressCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.addressHeader}>
            <Feather name="map-pin" size={20} color={theme.colors.primary} />
            <Text style={[styles.addressTitle, { color: theme.colors.text, fontSize: getFontSize(16) }]}>Address</Text>
          </View>
          <Text style={[styles.addressText, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
            {user?.address ? `${user.address}, ${user.city || ""} ${user.pincode || ""}` : "Address not specified"}
          </Text>
        </View>

        {/* Emergency Contacts */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Feather name="phone" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Emergency Contacts
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primaryLight }]}
              onPress={() => setContactModalVisible(true)}
            >
              <Feather name="plus" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading contacts...</Text>
            </View>
          ) : emergencyContacts.length > 0 ? (
            <View style={styles.contactsList}>
              {emergencyContacts.map((contact) => (
                <View key={contact.id} style={[styles.contactItem, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                      {contact.name}
                    </Text>
                    <Text
                      style={[
                        styles.contactRelationship,
                        { color: theme.colors.textSecondary, fontSize: getFontSize(14) },
                      ]}
                    >
                      {contact.relationship || "Relationship not specified"}
                    </Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={[styles.callButton, { backgroundColor: theme.colors.primaryLight }]}
                      onPress={() => handleEmergencyCall(contact.phone)}
                    >
                      <Feather name="phone" size={16} color={theme.colors.primary} />
                      <Text style={[styles.callButtonText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
                        Call
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteContact(contact.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="trash-2" size={16} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContacts}>
              <Text
                style={[styles.emptyContactsText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
              >
                No emergency contacts added yet
              </Text>
              <TouchableOpacity
                style={[styles.addContactButton, { backgroundColor: theme.colors.primaryLight }]}
                onPress={() => setContactModalVisible(true)}
              >
                <Text style={[styles.addContactButtonText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
                  Add Contact
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Medical History */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Feather name="heart" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Medical History
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primaryLight }]}
              onPress={() => router.push("/profile/medical-history")}
            >
              <Feather name="edit-2" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.medicalHistoryContent}>
            <View style={styles.medicalHistoryItem}>
              <Text style={[styles.medicalHistoryLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                Medical Conditions
              </Text>
              {medicalHistory.conditions && medicalHistory.conditions.length > 0 ? (
                <View style={styles.medicalHistoryList}>
                  {medicalHistory.conditions.map((condition, index) => (
                    <View
                      key={index}
                      style={[styles.medicalHistoryTag, { backgroundColor: theme.colors.primaryLight }]}
                    >
                      <Text
                        style={[
                          styles.medicalHistoryTagText,
                          { color: theme.colors.primary, fontSize: getFontSize(14) },
                        ]}
                      >
                        {condition}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  style={[
                    styles.medicalHistoryEmptyText,
                    { color: theme.colors.textSecondary, fontSize: getFontSize(14) },
                  ]}
                >
                  No medical conditions specified
                </Text>
              )}
            </View>

            <View style={styles.medicalHistoryItem}>
              <Text style={[styles.medicalHistoryLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                Allergies
              </Text>
              {medicalHistory.allergies && medicalHistory.allergies.length > 0 ? (
                <View style={styles.medicalHistoryList}>
                  {medicalHistory.allergies.map((allergy, index) => (
                    <View
                      key={index}
                      style={[styles.medicalHistoryTag, { backgroundColor: theme.colors.warningLight }]}
                    >
                      <Text
                        style={[
                          styles.medicalHistoryTagText,
                          { color: theme.colors.warning, fontSize: getFontSize(14) },
                        ]}
                      >
                        {allergy}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  style={[
                    styles.medicalHistoryEmptyText,
                    { color: theme.colors.textSecondary, fontSize: getFontSize(14) },
                  ]}
                >
                  No allergies specified
                </Text>
              )}
            </View>

            <View style={styles.medicalHistoryItem}>
              <Text style={[styles.medicalHistoryLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                Medications
              </Text>
              {medicalHistory.medications && medicalHistory.medications.length > 0 ? (
                <View style={styles.medicalHistoryList}>
                  {medicalHistory.medications.map((medication, index) => (
                    <View
                      key={index}
                      style={[styles.medicalHistoryTag, { backgroundColor: theme.colors.successLight }]}
                    >
                      <Text
                        style={[
                          styles.medicalHistoryTagText,
                          { color: theme.colors.success, fontSize: getFontSize(14) },
                        ]}
                      >
                        {medication}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  style={[
                    styles.medicalHistoryEmptyText,
                    { color: theme.colors.textSecondary, fontSize: getFontSize(14) },
                  ]}
                >
                  No medications specified
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Feather name="settings" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Settings
              </Text>
            </View>
          </View>

          <View style={styles.settingsList}>
            <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.settingInfo}>
                <Feather name="moon" size={20} color={theme.colors.textSecondary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={theme.mode === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={theme.mode === "dark" ? theme.colors.primary : "#f4f3f4"}
              />
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => setLanguageSelectorVisible(true)}
            >
              <View style={styles.settingInfo}>
                <Feather name="globe" size={20} color={theme.colors.textSecondary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Language
                </Text>
              </View>
              <View style={styles.languageValue}>
                <Text style={[styles.languageValueText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
                  {language === "english" ? "English" : language === "hindi" ? "हिंदी" : "ગુજરાતી"}
                </Text>
                <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.settingInfo}>
                <Feather name="volume-2" size={20} color={theme.colors.textSecondary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Voice Reading
                </Text>
              </View>
              <Switch
                value={voiceEnabled}
                onValueChange={handleVoiceToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={voiceEnabled ? theme.colors.primary : "#f4f3f4"}
              />
            </View>

            <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.settingInfo}>
                <Feather name="type" size={20} color={theme.colors.textSecondary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Font Size
                </Text>
              </View>
              <View style={styles.fontSizeControls}>
                <TouchableOpacity
                  style={[styles.fontSizeButton, { backgroundColor: theme.colors.primaryLight }]}
                  onPress={decreaseFontSize}
                  disabled={fontSizeScale <= 0.8}
                >
                  <Feather
                    name="minus"
                    size={16}
                    color={fontSizeScale <= 0.8 ? theme.colors.textSecondary : theme.colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fontSizeResetButton, { backgroundColor: theme.colors.primaryLight }]}
                  onPress={resetFontSize}
                >
                  <Text style={[styles.fontSizeResetText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
                    Reset
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fontSizeButton, { backgroundColor: theme.colors.primaryLight }]}
                  onPress={increaseFontSize}
                  disabled={fontSizeScale >= 1.5}
                >
                  <Feather
                    name="plus"
                    size={16}
                    color={fontSizeScale >= 1.5 ? theme.colors.textSecondary : theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => router.push("/reminder")}
            >
              <View style={styles.settingInfo}>
                <Feather name="bell" size={20} color={theme.colors.textSecondary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Reminders
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => router.push("/terms-service")}
            >
              <View style={styles.settingInfo}>
                <Feather name="file-text" size={20} color={theme.colors.textSecondary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Terms of Service
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => router.push("/privacy-policy")}
            >
              <View style={styles.settingInfo}>
                <Feather name="shield" size={20} color={theme.colors.textSecondary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Privacy Policy
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => router.push("/help-support")}
            >
              <View style={styles.settingInfo}>
                <Feather name="help-circle" size={20} color={theme.colors.textSecondary} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Help & Support
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={styles.settingInfo}>
                <Feather name="log-out" size={20} color={theme.colors.danger} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.colors.danger, fontSize: getFontSize(16) }]}>
                  Logout
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary, fontSize: getFontSize(12) }]}>
            Smart City Assistant v1.0.0
          </Text>
        </View>
      </Animated.ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector visible={languageSelectorVisible} onClose={() => setLanguageSelectorVisible(false)} />

      {/* Add Emergency Contact Modal */}
      <Modal
        visible={contactModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={Platform.OS === "ios" ? 10 : 25} style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
                Add Emergency Contact
              </Text>
              <TouchableOpacity
                onPress={() => setContactModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
                  ]}
                  placeholder="Contact Name"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newContact.name}
                  onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Relationship
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
                  ]}
                  placeholder="e.g. Son, Daughter, Friend"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newContact.relationship}
                  onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Phone Number *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
                  ]}
                  placeholder="Phone Number"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newContact.phone}
                  onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddContact}
              >
                <Text style={[styles.saveButtonText, { color: theme.colors.white, fontSize: getFontSize(18) }]}>
                  Save Contact
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%",
  },
  headerTitle: {
    fontFamily: "Inter-Bold",
    position: "absolute",
  },
  profileImage: {
    borderRadius: 40,
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontFamily: "Inter-Bold",
  },
  profileAge: {
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  editProfileButton: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingTop: 220, // Add extra padding to account for the header
    paddingBottom: 40,
  },
  addressCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressTitle: {
    fontFamily: "Inter-Bold",
    marginLeft: 8,
  },
  addressText: {
    fontFamily: "Inter-Regular",
    lineHeight: 20,
    paddingLeft: 28,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontFamily: "Inter-Bold",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    fontFamily: "Inter-Regular",
  },
  contactsList: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: "Inter-Medium",
  },
  contactRelationship: {
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  callButtonText: {
    fontFamily: "Inter-Medium",
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContacts: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyContactsText: {
    fontFamily: "Inter-Regular",
    marginBottom: 12,
  },
  addContactButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addContactButtonText: {
    fontFamily: "Inter-Medium",
  },
  medicalHistoryContent: {
    marginTop: 8,
  },
  medicalHistoryItem: {
    marginBottom: 16,
  },
  medicalHistoryLabel: {
    fontFamily: "Inter-Medium",
    marginBottom: 8,
  },
  medicalHistoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  medicalHistoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  medicalHistoryTagText: {
    fontFamily: "Inter-Medium",
  },
  medicalHistoryEmptyText: {
    fontFamily: "Inter-Regular",
    fontStyle: "italic",
  },
  settingsList: {
    marginTop: 8,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontFamily: "Inter-Medium",
  },
  languageValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageValueText: {
    fontFamily: "Inter-Medium",
    marginRight: 8,
  },
  fontSizeControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  fontSizeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeResetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  fontSizeResetText: {
    fontFamily: "Inter-Medium",
  },
  versionInfo: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  versionText: {
    fontFamily: "Inter-Regular",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: "Inter-Bold",
  },
  modalBody: {
    padding: 16,
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
  saveButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  saveButtonText: {
    fontFamily: "Inter-Bold",
  },
})
