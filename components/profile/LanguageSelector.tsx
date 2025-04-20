"use client"

import { useState } from "react"
import { StyleSheet, View, Text, Modal, TouchableOpacity, Platform } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { Feather } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"

type LanguageSelectorProps = {
  visible: boolean
  onClose: () => void
}

export const LanguageSelector = ({ visible, onClose }: LanguageSelectorProps) => {
  const { theme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState(language)

  const languages = [
    { id: "english", name: "English", flag: "🇺🇸" },
    { id: "hindi", name: "हिंदी", flag: "🇮🇳" },
    { id: "gujarati", name: "ગુજરાતી", flag: "🇮🇳" },
  ]

  const handleSelectLanguage = async (langId) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    setSelectedLanguage(langId)
  }

  const handleSave = async () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    await setLanguage(selectedLanguage)
    onClose()
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {Platform.OS === "ios" && (
          <BlurView intensity={80} tint={theme.mode === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        )}
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Language</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.languagesList}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.languageItem,
                  {
                    backgroundColor: selectedLanguage === lang.id ? theme.colors.primaryLight : theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleSelectLanguage(lang.id)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    {
                      color: selectedLanguage === lang.id ? theme.colors.primary : theme.colors.text,
                      fontFamily: selectedLanguage === lang.id ? "Inter-Bold" : "Inter-Regular",
                    },
                  ]}
                >
                  {lang.name}
                </Text>
                {selectedLanguage === lang.id && (
                  <Feather name="check" size={20} color={theme.colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontFamily: "Inter-Bold",
  },
  languagesList: {
    padding: 16,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageName: {
    fontSize: 18,
  },
  checkIcon: {
    marginLeft: "auto",
  },
  saveButton: {
    marginHorizontal: 16,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Inter-Bold",
  },
})
