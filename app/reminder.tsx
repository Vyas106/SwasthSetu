"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  Animated,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  ImageBackground,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { fetchReminders, saveReminder, updateReminder, deleteReminder } from "@/services/firebase"
import {
  requestNotificationPermissions,
  scheduleNotification,
  scheduleRecurringNotification,
  cancelNotification,
  handleNotificationReceived,
  setNotificationListeners,
  removeNotificationListeners,
} from "@/services/notifications"
import type { Reminder } from "@/types"
import { useFocusEffect } from "expo-router"
import DateTimePicker from "@react-native-community/datetimepicker"
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import * as Speech from "expo-speech"
import { LinearGradient } from "expo-linear-gradient"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Reminder types with icons and colors
const REMINDER_TYPES = [
  { id: "once", label: "One-time", icon: "bell", color: "#6A7BFF" },
  { id: "daily", label: "Daily", icon: "repeat", color: "#FF7A6A" },
  { id: "weekly", label: "Weekly", icon: "calendar", color: "#7AFFCF" },
  { id: "medication", label: "Medication", icon: "package", color: "#FC76FF" },
  { id: "appointment", label: "Appointment", icon: "calendar", color: "#FFB347" },
]

// Weekdays for weekly reminders
const WEEKDAYS = [
  { id: 1, name: "Mon", longName: "Monday" },
  { id: 2, name: "Tue", longName: "Tuesday" },
  { id: 3, name: "Wed", longName: "Wednesday" },
  { id: 4, name: "Thu", longName: "Thursday" },
  { id: 5, name: "Fri", longName: "Friday" },
  { id: 6, name: "Sat", longName: "Saturday" },
  { id: 7, name: "Sun", longName: "Sunday" },
]

export default function ReminderScreen() {
  const { theme, getFontSize } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const scrollY = useRef(new Animated.Value(0)).current
  const addButtonScale = useRef(new Animated.Value(1)).current

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterCompleted, setFilterCompleted] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [activeReminders, setActiveReminders] = useState<string[]>([])
  const [searchText, setSearchText] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  // Reminder modal state
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)
  const [newReminder, setNewReminder] = useState({
    id: "",
    title: "",
    description: "",
    date: new Date(),
    time: new Date(),
    isCompleted: false,
    notificationId: "",
    type: "once",
    weekdays: [] as number[],
    voicePrompt: "",
    color: "", // Custom color for reminder
  })
  
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(50)).current

  // Notification listeners
  useEffect(() => {
    // Show intro animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start()

    // Request notification permissions
    requestNotificationPermissions()

    // Set up notification listeners
    const subscriptions = setNotificationListeners(
      (notification) => {
        // Handle received notification
        handleNotificationReceived(notification)

        // Add to active reminders if it's a reminder notification
        const data = notification.request.content.data
        if (data.reminderId) {
          setActiveReminders((prev) => [...prev, data.reminderId])
          // Provide haptic feedback
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }
      },
      (response) => {
        // Handle notification response (when user taps on notification)
        const data = response.notification.request.content.data

        // If it's a reminder notification, mark it as completed or stop the voice prompt
        if (data.reminderId) {
          // Remove from active reminders
          setActiveReminders((prev) => prev.filter((id) => id !== data.reminderId))

          // Stop speech if it's playing
          if (Speech.isSpeakingAsync()) {
            Speech.stop()
          }

          // If it's a one-time reminder, mark it as completed
          if (data.type === "once") {
            handleToggleComplete(data.reminderId, true)
          }
        }
      },
    )

    // Clean up listeners on unmount
    return () => {
      removeNotificationListeners(subscriptions)
    }
  }, [])

  // Button animation on scroll
  useEffect(() => {
    const scrollListener = scrollY.addListener(({ value }) => {
      // Scale down the button when scrolling down
      if (value > 20) {
        Animated.spring(addButtonScale, {
          toValue: 0.8,
          friction: 8,
          useNativeDriver: true,
        }).start()
      } else {
        Animated.spring(addButtonScale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }).start()
      }
    })

    return () => {
      scrollY.removeListener(scrollListener)
    }
  }, [])

  const loadReminders = useCallback(async () => {
    if (user) {
      try {
        setLoading(true)
        const userReminders = await fetchReminders(user.id)
        setReminders(userReminders)
      } catch (error) {
        console.error("Error loading reminders:", error)
        Alert.alert("Error", "Failed to load reminders. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }, [user])

  // Load reminders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReminders()
    }, [loadReminders]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadReminders()
    setRefreshing(false)
  }, [loadReminders])

  const handleAddReminder = () => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    setIsEditing(false)
    setSelectedReminder(null)
    setNewReminder({
      id: "",
      title: "",
      description: "",
      date: new Date(),
      time: new Date(),
      isCompleted: false,
      notificationId: "",
      type: "once",
      weekdays: [],
      voicePrompt: "",
      color: REMINDER_TYPES[0].color, // Default color
    })
    setReminderModalVisible(true)
  }

  const handleEditReminder = (reminder: Reminder) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    setIsEditing(true)
    setSelectedReminder(reminder)

    // Parse date and time from reminder
    const reminderDate = new Date(reminder.dateTime)

    setNewReminder({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description || "",
      date: reminderDate,
      time: reminderDate,
      isCompleted: reminder.isCompleted,
      notificationId: reminder.notificationId || "",
      type: reminder.type || "once",
      weekdays: reminder.weekdays || [],
      voicePrompt: reminder.voicePrompt || "",
      color: reminder.color || getReminderTypeColor(reminder.type || "once"),
    })

    setReminderModalVisible(true)
  }

  const handleSaveReminder = async () => {
    if (!newReminder.title.trim()) {
      Alert.alert("Error", "Please enter a reminder title")
      return
    }

    try {
      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Combine date and time
      const reminderDateTime = new Date(newReminder.date)
      reminderDateTime.setHours(newReminder.time.getHours(), newReminder.time.getMinutes(), 0, 0)

      // Check if the date is in the past for one-time reminders
      if (newReminder.type === "once" && reminderDateTime < new Date() && !isEditing) {
        Alert.alert("Error", "Please select a future date and time")
        return
      }

      if (user) {
        // Create reminder object
        const reminderData: any = {
          title: newReminder.title,
          description: newReminder.description,
          dateTime: reminderDateTime,
          isCompleted: newReminder.isCompleted,
          type: newReminder.type,
          voicePrompt: newReminder.voicePrompt,
          color: newReminder.color,
        }

        // Add weekdays for weekly reminders
        if (newReminder.type === "weekly") {
          if (newReminder.weekdays.length === 0) {
            Alert.alert("Error", "Please select at least one day of the week")
            return
          }
          reminderData.weekdays = newReminder.weekdays
        }

        let notificationId = ""

        if (isEditing) {
          // If editing, cancel the existing notification
          if (newReminder.notificationId) {
            await cancelNotification(newReminder.notificationId)
          }

          // Schedule new notification if not completed and appropriate for the reminder type
          if (!newReminder.isCompleted) {
            if (newReminder.type === "once") {
              // One-time notification
              notificationId = await scheduleNotification(
                reminderData.title,
                reminderData.description || "It's time for your reminder!",
                reminderDateTime,
                { reminderId: newReminder.id, type: newReminder.type, voicePrompt: newReminder.voicePrompt },
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
                { reminderId: newReminder.id, type: newReminder.type, voicePrompt: newReminder.voicePrompt },
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
                  { reminderId: newReminder.id, type: newReminder.type, voicePrompt: newReminder.voicePrompt },
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
                { reminderId: newReminder.id, type: newReminder.type, voicePrompt: newReminder.voicePrompt },
                newReminder.type,
              )
            }
          }

          // Update reminder with new notification ID
          const updatedReminder = await updateReminder(user.id, newReminder.id, {
            ...reminderData,
            notificationId,
          })

          // Update local state
          setReminders(reminders.map((r) => (r.id === updatedReminder.id ? updatedReminder : r)))
        } else {
          // For new reminders, schedule notification based on type
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
                await cancelNotification(id)
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
              await cancelNotification(notificationId)

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

          // Update local state
          setReminders([savedReminder, ...reminders])
        }

        // Reset form and close modal
        setReminderModalVisible(false)
        
        // Show success toast instead of alert
        showToast(isEditing ? "Reminder updated successfully" : "Reminder set successfully")
      }
    } catch (error) {
      console.error("Error saving reminder:", error)
      Alert.alert("Error", "Failed to save reminder. Please try again.")
    }
  }

  const confirmDeleteReminder = (reminder: Reminder) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    setReminderToDelete(reminder)
    setShowDeleteConfirm(true)
  }

  const handleDeleteReminder = async () => {
    if (!user || !reminderToDelete) return

    try {
      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

      // Cancel scheduled notification(s)
      if (reminderToDelete.notificationId) {
        if (reminderToDelete.notificationId.includes(",")) {
          // Multiple notifications (weekly reminders)
          const ids = reminderToDelete.notificationId.split(",")
          for (const id of ids) {
            await cancelNotification(id)
          }
        } else {
          // Single notification
          await cancelNotification(reminderToDelete.notificationId)
        }
      }

      // Delete from database
      await deleteReminder(user.id, reminderToDelete.id)

      // Update local state
      setReminders(reminders.filter((r) => r.id !== reminderToDelete.id))

      // Remove from active reminders if it's currently active
      if (activeReminders.includes(reminderToDelete.id)) {
        setActiveReminders((prev) => prev.filter((id) => id !== reminderToDelete.id))

        // Stop speech if it's playing
        if (Speech.isSpeakingAsync()) {
          Speech.stop()
        }
      }

      setShowDeleteConfirm(false)
      showToast("Reminder deleted successfully")
    } catch (error) {
      console.error("Error deleting reminder:", error)
      Alert.alert("Error", "Failed to delete reminder. Please try again.")
    }
  }

  const handleToggleComplete = async (reminderId: string, isCompleted = true) => {
    const reminder = reminders.find((r) => r.id === reminderId)
    if (!user || !reminder) return

    try {
      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      
      const updatedReminder = { ...reminder, isCompleted }

      // If marking as complete, cancel notification(s)
      if (!reminder.isCompleted && isCompleted && reminder.notificationId) {
        if (reminder.notificationId.includes(",")) {
          // Multiple notifications (weekly reminders)
          const ids = reminder.notificationId.split(",")
          for (const id of ids) {
            await cancelNotification(id)
          }
        } else {
          // Single notification
          await cancelNotification(reminder.notificationId)
        }
        updatedReminder.notificationId = ""
      }

      // Update in database
      const result = await updateReminder(user.id, reminder.id, updatedReminder)

      // Update local state
      setReminders(reminders.map((r) => (r.id === reminder.id ? result : r)))

      // Remove from active reminders if it's currently active
      if (activeReminders.includes(reminder.id)) {
        setActiveReminders((prev) => prev.filter((id) => id !== reminder.id))

        // Stop speech if it's playing
        if (Speech.isSpeakingAsync()) {
          Speech.stop()
        }
      }
      
      showToast(isCompleted ? "Marked as completed" : "Marked as active")
    } catch (error) {
      console.error("Error updating reminder:", error)
      Alert.alert("Error", "Failed to update reminder. Please try again.")
    }
  }

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setNewReminder({ ...newReminder, date: selectedDate })
    }
  }

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setNewReminder({ ...newReminder, time: selectedTime })
    }
  }

  const handleToggleWeekday = (weekday: number) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
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
  }

  const handleStopActiveReminder = (reminderId: string) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    // Remove from active reminders
    setActiveReminders((prev) => prev.filter((id) => id !== reminderId))

    // Stop speech if it's playing
    if (Speech.isSpeakingAsync()) {
      Speech.stop()
    }
    
    showToast("Notification stopped")
  }

  const handleSelectReminderType = (type: string) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    setNewReminder({ 
      ...newReminder, 
      type,
      color: getReminderTypeColor(type) 
    })
  }
  
  const handleColorSelect = (color: string) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    setNewReminder({ ...newReminder, color })
  }
  
  const getReminderTypeColor = (type: string) => {
    const reminderType = REMINDER_TYPES.find(rt => rt.id === type)
    return reminderType?.color || "#6A7BFF" // Default color
  }
  
  const getReminderTypeIcon = (type: string) => {
    const reminderType = REMINDER_TYPES.find(rt => rt.id === type)
    return reminderType?.icon || "bell" // Default icon
  }

  // Toast notification
  const [toast, setToast] = useState({ visible: false, message: "" })
  
  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => {
      setToast({ visible: false, message: "" })
    }, 3000)
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

  // Filter reminders based on completion status, type, and search text
  const filteredReminders = reminders.filter((reminder) => {
    // Filter by completion status
    if (!filterCompleted && reminder.isCompleted) {
      return false
    }

    // Filter by type
    if (filterType && reminder.type !== filterType) {
      return false
    }
    
    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      return (
        reminder.title.toLowerCase().includes(searchLower) ||
        (reminder.description && reminder.description.toLowerCase().includes(searchLower))
      )
    }

    return true
  })

  // Group reminders by date
  const groupedReminders = filteredReminders.reduce((groups, reminder) => {
    const date = new Date(reminder.dateTime).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(reminder)
    return groups
  }, {})

  // Sort dates (today and future dates first, then past dates)
  const sortedDates = Object.keys(groupedReminders).sort((a, b) => {
    const today = new Date().toDateString()
    const dateA = new Date(a)
    const dateB = new Date(b)

    if (a === today) return -1
    if (b === today) return 1

    const now = new Date()
    const isPastA = dateA < now
    const isPastB = dateB < now

    if (isPastA && !isPastB) return 1
    if (!isPastA && isPastB) return -1

    return dateA - dateB
  })

  // Predefined colors for reminders
  const reminderColors = [
    "#6A7BFF", // Blue
    "#FF7A6A", // Red
    "#7AFFCF", // Green
    "#FC76FF", // Purple
    "#FFB347", // Orange
    "#47B8FF", // Sky blue
    "#FF66B2", // Pink
    "#8A74F9", // Lavender
  ]

  // Render reminder item
  const renderReminderItem = ({ item }: { item: Reminder }) => {
    const reminderDate = new Date(item.dateTime)
    const isPast = reminderDate < new Date()
    const isActive = activeReminders.includes(item.id)
    
    // Get icon based on reminder type
    const typeIcon = getReminderTypeIcon(item.type)
    const reminderColor = item.color || getReminderTypeColor(item.type)

    return (
      <Animated.View
        style={[
          styles.reminderCard,
          {
            backgroundColor: theme.colors.card,
            opacity: item.isCompleted ? 0.7 : 1,
            borderLeftWidth: 5,
            borderLeftColor: reminderColor,
            shadowColor: reminderColor,
            transform: [
              {
                scale: isActive
                  ? scrollY.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [1, 1.02, 1],
                      extrapolate: "clamp",
                    })
                  : 1,
              },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.reminderHeader} 
          onPress={() => handleEditReminder(item)} 
          activeOpacity={0.7}
          onLongPress={() => confirmDeleteReminder(item)}
        >
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                borderColor: item.isCompleted ? theme.colors.success : reminderColor,
                backgroundColor: item.isCompleted ? theme.colors.success : "transparent",
              },
            ]}
            onPress={() => handleToggleComplete(item.id, !item.isCompleted)}
          >
            {item.isCompleted && <Feather name="check" size={16} color={theme.colors.white} />}
          </TouchableOpacity>

          <View style={styles.reminderInfo}>
            <View style={styles.reminderTitleRow}>
              <Text
                style={[
                  styles.reminderTitle,
                  {
                    color: theme.colors.text,
                    textDecorationLine: item.isCompleted ? "line-through" : "none",
                    fontSize: getFontSize(16),
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              
              <View style={[styles.reminderTypeTag, { backgroundColor: `${reminderColor}30` }]}>
                <Feather name={typeIcon} size={12} color={reminderColor} style={styles.reminderTypeIcon} />
                <Text
                  style={[styles.reminderTypeText, { color: reminderColor, fontSize: getFontSize(12) }]}
                >
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            </View>

            <Text style={[styles.reminderDateTime, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
              {reminderDate.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              {isPast && !item.isCompleted && item.type === "once" && " (Overdue)"}
              {item.type === "weekly" && item.weekdays && item.weekdays.length > 0 && (
                <Text style={{ fontStyle: "italic" }}>
                  {" "}on {item.weekdays.map(day => WEEKDAYS.find(d => d.id === day)?.name).join(", ")}
                </Text>
              )}
            </Text>

            {item.description ? (
              <Text
                style={[
                  styles.reminderDescription,
                  { color: theme.colors.textSecondary, fontSize: getFontSize(14) },
                ]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
          </View>

          {isActive && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => handleStopActiveReminder(item.id)}
            >
              <Feather name="volume-x" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // Render date header
  const renderDateHeader = (date: string) => {
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    
    const isToday = new Date(date).toDateString() === new Date().toDateString()
    
    return (
      <View style={styles.dateHeader}>
        <Text style={[styles.dateHeaderText, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
          {isToday ? "Today" : formattedDate}
        </Text>
        {isToday && (
          <View style={[styles.todayIndicator, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.todayText, { color: theme.colors.white, fontSize: getFontSize(12) }]}>
              TODAY
            </Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: getFontSize(28) }]}>
          Reminders
        </Text>
        <View style={styles.headerButtons}>
          {showSearch ? (
            <TextInput
              style={[
                styles.searchInput,
                { backgroundColor: theme.colors.card, color: theme.colors.text }
              ]}
              placeholder="Search reminders..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
          ) : null}
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              if (showSearch) {
                setShowSearch(false)
                setSearchText("")
              } else {
                setShowSearch(true)
              }
            }}
          >
            <Feather
              name={showSearch ? "x" : "search"}
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setFilterCompleted(!filterCompleted)
            }}
          >
            <Feather
              name="check-circle"
              size={22}
              color={filterCompleted ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push("/settings")
            }}
          >
            <Feather name="settings" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: filterType === null ? theme.colors.primary : theme.colors.card,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setFilterType(null)
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color: filterType === null ? theme.colors.white : theme.colors.text,
                fontSize: getFontSize(14),
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        {REMINDER_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterType === type.id ? type.color : theme.colors.card,
                borderColor: type.color,
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setFilterType(type.id)
            }}
          >
            <Feather
              name={type.icon}
              size={14}
              color={filterType === type.id ? theme.colors.white : type.color}
              style={styles.filterChipIcon}
            />
            <Text
              style={[
                styles.filterChipText,
                {
                  color: filterType === type.id ? theme.colors.white : type.color,
                  fontSize: getFontSize(14),
                },
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reminders list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredReminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="calendar" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: getFontSize(18) }]}>
            {searchText ? "No matching reminders found" : "No reminders yet"}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
            {searchText
              ? "Try a different search term"
              : "Add your first reminder by tapping the + button"}
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.remindersList}
          contentContainerStyle={styles.remindersListContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          {sortedDates.map((date) => (
            <View key={date}>
              {renderDateHeader(date)}
              {groupedReminders[date].map((reminder) => (
                <View key={reminder.id}>
                  {renderReminderItem({ item: reminder })}
                </View>
              ))}
            </View>
          ))}
          
          {/* Add extra space at the bottom for the floating button */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      )}

      {/* Add Reminder Button */}
      <Animated.View
        style={[
          styles.addButtonContainer,
          {
            transform: [{ scale: addButtonScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddReminder}
        >
          <Feather name="plus" size={28} color={theme.colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* Add/Edit Reminder Modal */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <BlurView intensity={90} style={styles.modalBackground} tint={theme.dark ? "dark" : "light"}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
                  {isEditing ? "Edit Reminder" : "New Reminder"}
                </Text>
                <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                  <Feather name="x" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                {/* Reminder Type Selection */}
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Reminder Type
                </Text>
                <View style={styles.reminderTypeContainer}>
                  {REMINDER_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.reminderTypeOption,
                        {
                          backgroundColor: newReminder.type === type.id ? `${type.color}30` : theme.colors.card,
                          borderColor: newReminder.type === type.id ? type.color : theme.colors.border,
                        },
                      ]}
                      onPress={() => handleSelectReminderType(type.id)}
                    >
                      <Feather
                        name={type.icon}
                        size={20}
                        color={newReminder.type === type.id ? type.color : theme.colors.textSecondary}
                        style={styles.reminderTypeOptionIcon}
                      />
                      <Text
                        style={[
                          styles.reminderTypeOptionText,
                          {
                            color: newReminder.type === type.id ? type.color : theme.colors.text,
                            fontSize: getFontSize(14),
                          },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Title */}
                <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Title
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.colors.card, color: theme.colors.text },
                  ]}
                  placeholder="Enter reminder title"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newReminder.title}
                  onChangeText={(text) => setNewReminder({ ...newReminder, title: text })}
                />

                {/* Description */}
                <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Description (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.colors.card, color: theme.colors.text },
                  ]}
                  placeholder="Enter description"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  value={newReminder.description}
                  onChangeText={(text) => setNewReminder({ ...newReminder, description: text })}
                />

                {/* Date and Time */}
                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeField}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                      Date
                    </Text>
                    <TouchableOpacity
                      style={[styles.dateTimeButton, { backgroundColor: theme.colors.card }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Feather name="calendar" size={18} color={theme.colors.primary} style={styles.dateTimeIcon} />
                      <Text style={[styles.dateTimeText, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
                        {formatDate(newReminder.date)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateTimeField}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                      Time
                    </Text>
                    <TouchableOpacity
                      style={[styles.dateTimeButton, { backgroundColor: theme.colors.card }]}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Feather name="clock" size={18} color={theme.colors.primary} style={styles.dateTimeIcon} />
                      <Text style={[styles.dateTimeText, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
                        {formatTime(newReminder.time)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weekday Selection (for weekly reminders) */}
                {newReminder.type === "weekly" && (
                  <View style={styles.weekdaysContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                      Repeat On
                    </Text>
                    <View style={styles.weekdayButtons}>
                      {WEEKDAYS.map((day) => (
                        <TouchableOpacity
                          key={day.id}
                          style={[
                            styles.weekdayButton,
                            {
                              backgroundColor: newReminder.weekdays.includes(day.id)
                                ? theme.colors.primary
                                : theme.colors.card,
                            },
                          ]}
                          onPress={() => handleToggleWeekday(day.id)}
                        >
                          <Text
                            style={[
                              styles.weekdayText,
                              {
                                color: newReminder.weekdays.includes(day.id)
                                  ? theme.colors.white
                                  : theme.colors.text,
                                fontSize: getFontSize(14),
                              },
                            ]}
                          >
                            {day.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Voice Prompt */}
                <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Voice Prompt (Optional)
                </Text>
                <View style={[styles.voicePromptContainer, { backgroundColor: theme.colors.card }]}>
                  <TextInput
                    style={[styles.voicePromptInput, { color: theme.colors.text }]}
                    placeholder="Enter text to be spoken when reminder activates"
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    numberOfLines={2}
                    value={newReminder.voicePrompt}
                    onChangeText={(text) => setNewReminder({ ...newReminder, voicePrompt: text })}
                  />
                  <TouchableOpacity
                    style={styles.voiceTestButton}
                    onPress={() => {
                      if (newReminder.voicePrompt) {
                        Speech.speak(newReminder.voicePrompt)
                      }
                    }}
                  >
                    <Feather name="volume-2" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Color Selection */}
                <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Color
                </Text>
                <View style={styles.colorPickerContainer}>
                  {reminderColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        {
                          backgroundColor: color,
                          borderWidth: newReminder.color === color ? 3 : 0,
                          borderColor: theme.colors.background,
                        },
                      ]}
                      onPress={() => handleColorSelect(color)}
                    >
                      {newReminder.color === color && (
                        <Feather name="check" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                {isEditing && (
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: theme.colors.error + "20" }]}
                    onPress={() => {
                      setReminderModalVisible(false)
                      setTimeout(() => confirmDeleteReminder(selectedReminder), 300)
                    }}
                  >
                    <Feather name="trash-2" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSaveReminder}
                >
                  <Text style={[styles.saveButtonText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
                    {isEditing ? "Update" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={newReminder.date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={newReminder.time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <BlurView intensity={90} style={styles.modalBackground} tint={theme.dark ? "dark" : "light"}>
          <View style={[styles.confirmModalContent, { backgroundColor: theme.colors.background }]}>
            <Feather name="alert-triangle" size={48} color={theme.colors.error} style={styles.confirmIcon} />
            <Text style={[styles.confirmTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
              Delete Reminder
            </Text>
            <Text style={[styles.confirmText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.card }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, { backgroundColor: theme.colors.error }]}
                onPress={handleDeleteReminder}
              >
                <Text style={[styles.deleteConfirmText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Toast Notification */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: theme.colors.card,
              opacity: fadeAnim,
              // transform: [{ translateY: translateY }],
            },
          ]}
        >
          <Text style={[styles.toastText, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginLeft: 8,
  },
  searchInput: {
    height: 40,
    width: 160,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipIcon: {
    marginRight: 4,
  },
  filterChipText: {
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    textAlign: "center",
    marginTop: 8,
  },
  remindersList: {
    flex: 1,
  },
  remindersListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  dateHeaderText: {
    fontWeight: "bold",
  },
  todayIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  todayText: {
    fontWeight: "bold",
  },
  reminderCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: "row",
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  reminderTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderTitle: {
    fontWeight: "bold",
    flex: 1,
  },
  reminderTypeTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  reminderTypeIcon: {
    marginRight: 4,
  },
  reminderTypeText: {
    fontWeight: "500",
  },
  reminderDateTime: {
    marginTop: 4,
  },
  reminderDescription: {
    marginTop: 8,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: "bold",
  },
  modalForm: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  reminderTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  reminderTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  reminderTypeOptionIcon: {
    marginRight: 6,
  },
  reminderTypeOptionText: {
    fontWeight: "500",
  },
  inputLabel: {
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateTimeField: {
    width: "48%",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateTimeIcon: {
    marginRight: 8,
  },
  dateTimeText: {
    flex: 1,
  },
  weekdaysContainer: {
    marginBottom: 16,
  },
  weekdayButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  weekdayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  weekdayText: {
    fontWeight: "500",
  },
  voicePromptContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 16,
  },
  voicePromptInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  voiceTestButton: {
    padding: 12,
  },
  colorPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  saveButtonText: {
    fontWeight: "bold",
  },
  confirmModalContent: {
    margin: 24,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  confirmText: {
    textAlign: "center",
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "500",
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  deleteConfirmText: {
    fontWeight: "500",
  },
  toast: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    fontWeight: "500",
    textAlign: "center",
  },
})

// Import the necessary component for RefreshControl since it was missing
import { RefreshControl } from "react-native"

// Import statement was missing for the notification listener types
import * as Notifications from "expo-notifications"

/**
 * Types definitions (could be placed in a separate types file)
 */
export type WeekdayType = {
  id: number
  name: string
  longName: string
}

export type ReminderType = {
  id: string
  label: string
  icon: string
  color: string
}

// 