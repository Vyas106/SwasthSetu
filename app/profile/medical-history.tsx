"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { Feather } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"

export default function MedicalHistoryScreen() {
  const router = useRouter()
  const { theme, getFontSize } = useTheme()
  const { user, updateProfile } = useAuth()

  const [loading, setLoading] = useState(false)
  const [medicalHistory, setMedicalHistory] = useState({
    conditions: [] as string[],
    allergies: [] as string[],
    medications: [] as string[],
  })
  const [newCondition, setNewCondition] = useState("")
  const [newAllergy, setNewAllergy] = useState("")
  const [newMedication, setNewMedication] = useState("")

  useEffect(() => {
    if (user && user.medicalHistory) {
      setMedicalHistory(user.medicalHistory)
    }
  }, [user])

  const handleAddCondition = () => {
    if (!newCondition.trim()) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    setMedicalHistory({
      ...medicalHistory,
      conditions: [...medicalHistory.conditions, newCondition.trim()],
    })
    setNewCondition("")
  }

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    setMedicalHistory({
      ...medicalHistory,
      allergies: [...medicalHistory.allergies, newAllergy.trim()],
    })
    setNewAllergy("")
  }

  const handleAddMedication = () => {
    if (!newMedication.trim()) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    setMedicalHistory({
      ...medicalHistory,
      medications: [...medicalHistory.medications, newMedication.trim()],
    })
    setNewMedication("")
  }

  const handleRemoveCondition = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const updatedConditions = [...medicalHistory.conditions]
    updatedConditions.splice(index, 1)
    setMedicalHistory({
      ...medicalHistory,
      conditions: updatedConditions,
    })
  }

  const handleRemoveAllergy = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const updatedAllergies = [...medicalHistory.allergies]
    updatedAllergies.splice(index, 1)
    setMedicalHistory({
      ...medicalHistory,
      allergies: updatedAllergies,
    })
  }

  const handleRemoveMedication = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const updatedMedications = [...medicalHistory.medications]
    updatedMedications.splice(index, 1)
    setMedicalHistory({
      ...medicalHistory,
      medications: updatedMedications,
    })
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      await updateProfile({ medicalHistory })
      Alert.alert("Success", "Medical history updated successfully")
      router.back()
    } catch (error) {
      console.error("Error updating medical history:", error)
      Alert.alert("Error", "Failed to update medical history. Please try again.")
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
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
          Medical History
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
            Medical Conditions
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
              ]}
              placeholder="Add a medical condition"
              placeholderTextColor={theme.colors.textSecondary}
              value={newCondition}
              onChangeText={setNewCondition}
              onSubmitEditing={handleAddCondition}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddCondition}
            >
              <Feather name="plus" size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.tagContainer}>
            {medicalHistory.conditions.map((condition, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.tagText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
                  {condition}
                </Text>
                <TouchableOpacity style={styles.removeTag} onPress={() => handleRemoveCondition(index)}>
                  <Feather name="x" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
            {medicalHistory.conditions.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                No medical conditions added
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>Allergies</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
              ]}
              placeholder="Add an allergy"
              placeholderTextColor={theme.colors.textSecondary}
              value={newAllergy}
              onChangeText={setNewAllergy}
              onSubmitEditing={handleAddAllergy}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddAllergy}
            >
              <Feather name="plus" size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.tagContainer}>
            {medicalHistory.allergies.map((allergy, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.colors.warningLight }]}>
                <Text style={[styles.tagText, { color: theme.colors.warning, fontSize: getFontSize(14) }]}>
                  {allergy}
                </Text>
                <TouchableOpacity style={styles.removeTag} onPress={() => handleRemoveAllergy(index)}>
                  <Feather name="x" size={16} color={theme.colors.warning} />
                </TouchableOpacity>
              </View>
            ))}
            {medicalHistory.allergies.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                No allergies added
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
            Medications
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
              ]}
              placeholder="Add a medication"
              placeholderTextColor={theme.colors.textSecondary}
              value={newMedication}
              onChangeText={setNewMedication}
              onSubmitEditing={handleAddMedication}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddMedication}
            >
              <Feather name="plus" size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.tagContainer}>
            {medicalHistory.medications.map((medication, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.tagText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
                  {medication}
                </Text>
                <TouchableOpacity style={styles.removeTag} onPress={() => handleRemoveMedication(index)}>
                  <Feather name="x" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
            {medicalHistory.medications.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                No medications added
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.colors.white, fontSize: getFontSize(18) }]}>
              Save Medical History
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
  sectionTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: "Inter-Regular",
    marginRight: 8,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontFamily: "Inter-Medium",
    marginRight: 4,
  },
  removeTag: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontStyle: "italic",
    padding: 8,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    fontFamily: "Inter-Bold",
  },
})
