"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Platform } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { Feather } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import DateTimePicker from "@react-native-community/datetimepicker"
import { saveReminder } from "@/services/firebase"
import { scheduleNotification, scheduleRecurringNotification } from "@/services/notifications"
import * as Haptics from "expo-haptics"

// Reminder types
const REMINDER_TYPES = [
  { id: "once", label: "One-time" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "medication", label: "Medication" },
  { id: "appointment", label: "Appointment" },
]

// Weekdays for weekly reminders
const WEEKDAYS = [
  { id: 1, name: "Mon" },
  { id: 2, name: "Tue" },
  { id: 3, name: "Wed" },
  { id: 4, name: "Thu" },
  { id: 5, name: "Fri" },
  { id: 6, name: "Sat" },
  { id: 7, name: "Sun" },
]

interface AddReminderModalProps {
  visible: boolean
  onClose: () => void
  onReminderAdded: (reminder: any) => void
}

export const AddReminderModal = ({ visible, onClose, onReminderAdded }: AddReminderModalProps) => {
  const { theme } = useTheme()
  const { user } = useAuth()

  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    date: new Date(),
    time: new Date(),
    type: "once",
    weekdays: [] as number[],
    voicePrompt: "",
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setNewReminder({
        title: "",
        description: "",
        date: new Date(),
        time: new Date(),
        type: "once",
        weekdays: [],
        voicePrompt: "",
      })
      setErrors({})
    }
  }, [visible])

  const validateForm = () => {
    const newErrors = {}

    if (!newReminder.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (newReminder.type === "weekly" && newReminder.weekdays.length === 0) {
      newErrors.weekdays = "Please select at least one day of the week"
    }

    // Check if the date is in the past for one-time reminders
    if (newReminder.type === "once") {
      const reminderDateTime = new Date(newReminder.date)
      reminderDateTime.setHours(newReminder.time.getHours(), newReminder.time.getMinutes(), 0, 0)

      if (reminderDateTime < new Date()) {
        newErrors.date = "Please select a future date and time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveReminder = async () => {
    if (!validateForm()) return

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }

    setIsLoading(true)
    try {
      if (user) {
        // Combine date and time
        const reminderDateTime = new Date(newReminder.date)
        reminderDateTime.setHours(newReminder.time.getHours(), newReminder.time.getMinutes(), 0, 0)

        // Create reminder object
        const reminderData: any = {
          title: newReminder.title,
          description: newReminder.description,
          dateTime: reminderDateTime,
          isCompleted: false,
          type: newReminder.type,
          voicePrompt: newReminder.voicePrompt,
        }

        // Add weekdays for weekly reminders
        if (newReminder.type === "weekly") {
          reminderData.weekdays = newReminder.weekdays
        }

        let notificationId = ""

        // Schedule notification based on type
        if (newReminder.type === "once") {
          // One-time notification
          notificationId = await scheduleNotification(
            reminderData.title,
            reminderData.description || "It's time for your reminder!",
            reminderDateTime,
            { type: newReminder.type, voicePrompt: newReminder.voicePrompt },
            newReminder.type,
          )
        } else if (newReminder.type === "daily") {
          // Daily recurring notification
          notificationId = await scheduleRecurringNotification(
            reminderData.title,
            reminderData.description || "It's time for your daily reminder!",
            reminderDateTime.getHours(),
            reminderDateTime.getMinutes(),
            undefined, // No specific weekday for daily reminders
            { type: newReminder.type, voicePrompt: newReminder.voicePrompt },
            newReminder.type,
          )
        } else if (newReminder.type === "weekly") {
          // Weekly recurring notifications (one for each selected day)
          const notificationIds = []
          for (const weekday of newReminder.weekdays) {
            const id = await scheduleRecurringNotification(
              reminderData.title,
              reminderData.description || "It's time for your weekly reminder!",
              reminderDateTime.getHours(),
              reminderDateTime.getMinutes(),
              weekday,
              { type: newReminder.type, voicePrompt: newReminder.voicePrompt },
              newReminder.type,
            )
            notificationIds.push(id)
          }
          notificationId = notificationIds.join(",")
        } else if (newReminder.type === "medication" || newReminder.type === "appointment") {
          // Special reminder types (medication, appointment)
          notificationId = await scheduleNotification(
            reminderData.title,
            reminderData.description || `It's time for your ${newReminder.type}!`,
            reminderDateTime,
            { type: newReminder.type, voicePrompt: newReminder.voicePrompt },
            newReminder.type,
          )
        }

        // Save reminder with notification ID
        const savedReminder = await saveReminder(user.id, {
          ...reminderData,
          notificationId,
        })

        // Update the notification with the reminder ID
        if (notificationId) {
          // For multiple notifications (weekly reminders)
          if (notificationId.includes(",")) {
            const ids = notificationId.split(",")
            for (const id of ids) {
              await scheduleRecurringNotification(
                reminderData.title,
                reminderData.description || "It's time for your weekly reminder!",
                reminderDateTime.getHours(),
                reminderDateTime.getMinutes(),
                newReminder.weekdays[ids.indexOf(id)],
                { reminderId: savedReminder.id, type: newReminder.type, voicePrompt: newReminder.voicePrompt },
                newReminder.type,
              )
            }
          } else {
            // For single notifications
            if (newReminder.type === "once") {
              await scheduleNotification(
                reminderData.title,
                reminderData.description || "It's time for your reminder!",
                reminderDateTime,
                { reminderId: savedReminder.id, type: newReminder.type, voicePrompt: newReminder.voicePrompt },
                newReminder.type,
              )
            } else if (newReminder.type === "daily") {
              await scheduleRecurringNotification(
                reminderData.title,
                reminderData.description || "It's time for your daily reminder!",
                reminderDateTime.getHours(),
                reminderDateTime.getMinutes(),
                undefined,
                { reminderId: savedReminder.id, type: newReminder.type, voicePrompt: newReminder.voicePrompt },
                newReminder.type,
              )
            } else {
              await scheduleNotification(
                reminderData.title,
                reminderData.description || `It's time for your ${newReminder.type}!`,
                reminderDateTime,
                { reminderId: savedReminder.id, type: newReminder.type, voicePrompt: newReminder.voicePrompt },
                newReminder.type,
              )
            }
          }
        }

        // Notify parent component
        onReminderAdded(savedReminder)

        // Close modal
        onClose()
      }
    } catch (error) {
      console.error("Error saving reminder:", error)
      setErrors({ general: "Failed to save reminder. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setNewReminder({ ...newReminder, date: selectedDate })

      // Clear date error if it exists
      if (errors.date) {
        setErrors({ ...errors, date: "" })
      }
    }
  }

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setNewReminder({ ...newReminder, time: selectedTime })

      // Clear date error if it exists
      if (errors.date) {
        setErrors({ ...errors, date: "" })
      }
    }
  }

  const handleToggleWeekday = (weekday: number) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    if (newReminder.weekdays.includes(weekday)) {
      setNewReminder({
        ...newReminder,
        weekdays: newReminder.weekdays.filter((day) => day !== weekday),
      })
    } else {
      setNewReminder({
        ...newReminder,
        weekdays: [...newReminder.weekdays, weekday],
      })
    }

    // Clear weekdays error if it exists
    if (errors.weekdays) {
      setErrors({ ...errors, weekdays: "" })
    }
  }

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format time for display
  const formatTime = (time) => {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={Platform.OS === "ios" ? 10 : 25} style={StyleSheet.absoluteFill} />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Reminder</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {errors.general && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.dangerLight }]}>
                <Feather name="alert-circle" size={20} color={theme.colors.danger} />
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.general}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Title *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: errors.title ? theme.colors.danger : theme.colors.border },
                  newReminder.title.length > 0 && !errors.title && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="edit-3"
                  size={20}
                  color={
                    errors.title
                      ? theme.colors.danger
                      : newReminder.title.length > 0
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Reminder Title"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newReminder.title}
                  onChangeText={(text) => {
                    setNewReminder({ ...newReminder, title: text })
                    if (errors.title && text.trim()) {
                      setErrors({ ...errors, title: "" })
                    }
                  }}
                />
              </View>
              {errors.title ? (
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.title}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Description</Text>
              <View
                style={[
                  styles.textAreaWrapper,
                  { borderColor: theme.colors.border },
                  newReminder.description.length > 0 && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="align-left"
                  size={20}
                  color={newReminder.description.length > 0 ? theme.colors.primary : theme.colors.textSecondary}
                  style={[styles.inputIcon, { marginTop: 16 }]}
                />
                <TextInput
                  style={[styles.textArea, { color: theme.colors.text }]}
                  placeholder="Description (Optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newReminder.description}
                  onChangeText={(text) => setNewReminder({ ...newReminder, description: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Reminder Type *</Text>
              <View style={styles.reminderTypeButtons}>
                {REMINDER_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.reminderTypeButton,
                      {
                        backgroundColor:
                          newReminder.type === type.id ? theme.colors.primary : theme.colors.primaryLight,
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS === "ios") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      }
                      setNewReminder({ ...newReminder, type: type.id })
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.reminderTypeButtonText,
                        {
                          color: newReminder.type === type.id ? theme.colors.white : theme.colors.primary,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {newReminder.type === "weekly" && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Repeat on *</Text>
                <View style={styles.weekdaysContainer}>
                  {WEEKDAYS.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.weekdayButton,
                        {
                          backgroundColor: newReminder.weekdays.includes(day.id)
                            ? theme.colors.primary
                            : theme.colors.primaryLight,
                        },
                      ]}
                      onPress={() => handleToggleWeekday(day.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.weekdayButtonText,
                          {
                            color: newReminder.weekdays.includes(day.id) ? theme.colors.white : theme.colors.primary,
                          },
                        ]}
                      >
                        {day.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.weekdays ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.weekdays}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeInput}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Date *</Text>
                <TouchableOpacity
                  style={[
                    styles.dateTimePicker,
                    { borderColor: errors.date ? theme.colors.danger : theme.colors.border },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                    {formatDate(newReminder.date)}
                  </Text>
                  <Feather name="calendar" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                {errors.date ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.date}</Text>
                ) : null}
              </View>

              <View style={styles.dateTimeInput}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Time *</Text>
                <TouchableOpacity
                  style={[styles.dateTimePicker, { borderColor: theme.colors.border }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                    {formatTime(newReminder.time)}
                  </Text>
                  <Feather name="clock" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Voice Prompt</Text>
              <View
                style={[
                  styles.textAreaWrapper,
                  { borderColor: theme.colors.border },
                  newReminder.voicePrompt.length > 0 && { borderColor: theme.colors.primary },
                ]}
              >
                <Feather
                  name="volume-2"
                  size={20}
                  color={newReminder.voicePrompt.length > 0 ? theme.colors.primary : theme.colors.textSecondary}
                  style={[styles.inputIcon, { marginTop: 16 }]}
                />
                <TextInput
                  style={[styles.textArea, { color: theme.colors.text }]}
                  placeholder="What should be spoken when the reminder triggers? (Optional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newReminder.voicePrompt}
                  onChangeText={(text) => setNewReminder({ ...newReminder, voicePrompt: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newReminder.date}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker value={newReminder.time} mode="time" display="default" onChange={handleTimeChange} />
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSaveReminder}
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
                <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>Set Reminder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: "90%",
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
    fontSize: 20,
  },
  modalBody: {
    padding: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    marginBottom: 8,
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
  reminderTypeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  reminderTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    margin: 4,
  },
  reminderTypeButtonText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  weekdaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayButtonText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateTimeInput: {
    width: "48%",
  },
  dateTimePicker: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateTimeText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonText: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
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
})
