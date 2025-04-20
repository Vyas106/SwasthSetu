import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import * as Speech from "expo-speech"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// Request permissions
export const requestNotificationPermissions = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      return false
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4E7AC7",
      })

      // Create specific channels for different reminder types
      await Notifications.setNotificationChannelAsync("daily-reminders", {
        name: "Daily Reminders",
        description: "Notifications for daily reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4E7AC7",
      })

      await Notifications.setNotificationChannelAsync("medication-reminders", {
        name: "Medication Reminders",
        description: "Notifications for medication reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250, 250, 250],
        lightColor: "#FF6384",
      })

      await Notifications.setNotificationChannelAsync("appointment-reminders", {
        name: "Appointment Reminders",
        description: "Notifications for appointment reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6C63FF",
      })
    }

    return true
  }

  return false
}

// Schedule a notification
export const scheduleNotification = async (
  title: string,
  body: string,
  triggerDate: Date,
  data: any = {},
  reminderType = "default",
) => {
  try {
    // Get voice settings
    const settings = await AsyncStorage.getItem("userSettings")
    const voiceEnabled = settings ? JSON.parse(settings).voiceEnabled : false

    // Determine the channel ID based on reminder type (for Android)
    let channelId = "default"
    if (Platform.OS === "android") {
      if (reminderType === "medication") {
        channelId = "medication-reminders"
      } else if (reminderType === "appointment") {
        channelId = "appointment-reminders"
      } else if (reminderType === "daily") {
        channelId = "daily-reminders"
      }
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, voiceEnabled, reminderType },
        sound: true,
        ...(Platform.OS === "android" && { channelId }),
      },
      trigger: {
        date: triggerDate,
      },
    })

    return notificationId
  } catch (error) {
    console.error("Error scheduling notification:", error)
    throw error
  }
}

// Schedule a recurring notification (daily, weekly, etc.)
export const scheduleRecurringNotification = async (
  title: string,
  body: string,
  hour: number,
  minute: number,
  weekday?: number, // 1-7 for Monday-Sunday, undefined for daily
  data: any = {},
  reminderType = "default",
) => {
  try {
    // Get voice settings
    const settings = await AsyncStorage.getItem("userSettings")
    const voiceEnabled = settings ? JSON.parse(settings).voiceEnabled : false

    // Determine the channel ID based on reminder type (for Android)
    let channelId = "default"
    if (Platform.OS === "android") {
      if (reminderType === "medication") {
        channelId = "medication-reminders"
      } else if (reminderType === "appointment") {
        channelId = "appointment-reminders"
      } else if (reminderType === "daily") {
        channelId = "daily-reminders"
      }
    }

    // Create the trigger
    const trigger: any = {
      hour,
      minute,
      repeats: true,
    }

    // Add weekday if specified (for weekly reminders)
    if (weekday) {
      trigger.weekday = weekday
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, voiceEnabled, reminderType, recurring: true },
        sound: true,
        ...(Platform.OS === "android" && { channelId }),
      },
      trigger,
    })

    return notificationId
  } catch (error) {
    console.error("Error scheduling recurring notification:", error)
    throw error
  }
}

// Cancel a notification
export const cancelNotification = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
    return true
  } catch (error) {
    console.error("Error canceling notification:", error)
    throw error
  }
}

// Cancel all notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    return true
  } catch (error) {
    console.error("Error canceling all notifications:", error)
    throw error
  }
}

// Get all scheduled notifications
export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync()
    return notifications
  } catch (error) {
    console.error("Error getting scheduled notifications:", error)
    throw error
  }
}

// Handle notification received
export const handleNotificationReceived = (notification) => {
  const data = notification.request.content.data

  // If voice reading is enabled, read the notification aloud
  if (data.voiceEnabled) {
    const title = notification.request.content.title
    const body = notification.request.content.body
    const textToRead = `${title}. ${body}`

    Speech.speak(textToRead, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9,
    })
  }

  return notification
}

// Set up notification listeners
export const setNotificationListeners = (
  receivedListener: (notification: Notifications.Notification) => void,
  responseListener: (response: Notifications.NotificationResponse) => void,
) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(receivedListener)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(responseListener)

  return {
    receivedSubscription,
    responseSubscription,
  }
}

// Remove notification listeners
export const removeNotificationListeners = (subscriptions: {
  receivedSubscription: Notifications.Subscription
  responseSubscription: Notifications.Subscription
}) => {
  Notifications.removeNotificationSubscription(subscriptions.receivedSubscription)
  Notifications.removeNotificationSubscription(subscriptions.responseSubscription)
}
