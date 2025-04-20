import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import * as Speech from "expo-speech"
import { Audio } from "expo-av"

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// Request notification permissions
export const requestNotificationPermissions = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!")
      return false
    }

    return true
  } else {
    console.log("Must use physical device for Push Notifications")
    return false
  }
}

// Schedule a one-time notification
export const scheduleNotification = async (title, body, date, data = {}, type = "default") => {
  try {
    // Ensure the date is in the future
    const now = new Date()
    if (date < now) {
      console.warn("Notification date is in the past, adjusting to now + 1 minute")
      date = new Date(now.getTime() + 60000) // 1 minute from now
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, type },
        sound: true,
      },
      trigger: {
        date,
      },
    })

    return notificationId
  } catch (error) {
    console.error("Error scheduling notification:", error)
    return null
  }
}

// Schedule a recurring notification (daily or weekly)
export const scheduleRecurringNotification = async (
  title,
  body,
  hour,
  minute,
  weekday, // undefined for daily, 1-7 for weekly (Monday-Sunday)
  data = {},
  type = "default",
) => {
  try {
    const trigger = weekday ? { hour, minute, weekday, repeats: true } : { hour, minute, repeats: true }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, type },
        sound: true,
      },
      trigger,
    })

    return notificationId
  } catch (error) {
    console.error("Error scheduling recurring notification:", error)
    return null
  }
}

// Cancel a notification
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
    return true
  } catch (error) {
    console.error("Error canceling notification:", error)
    return false
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

// Handle received notification
export const handleNotificationReceived = async (notification) => {
  try {
    const data = notification.request.content.data

    // Play sound based on notification type
    await playNotificationSound(data.type)

    // Speak the voice prompt if provided
    if (data.voicePrompt) {
      Speech.speak(data.voicePrompt, {
        language: "en",
        pitch: 1.0,
        rate: 0.9,
        voice: "com.apple.ttsbundle.Samantha-compact",
      })
    } else {
      // Speak the notification title and body if no voice prompt
      const title = notification.request.content.title
      const body = notification.request.content.body
      Speech.speak(`${title}. ${body}`, {
        language: "en",
        pitch: 1.0,
        rate: 0.9,
        voice: "com.apple.ttsbundle.Samantha-compact",
      })
    }

    return true
  } catch (error) {
    console.error("Error handling notification:", error)
    return false
  }
}

// Play notification sound based on type
export const playNotificationSound = async (type = "default") => {
  try {
    let soundFile

    switch (type) {
      case "medication":
        soundFile = require("../assets/sounds/medication.mp3")
        break
      case "appointment":
        soundFile = require("../assets/sounds/appointment.mp3")
        break
      case "warning":
        soundFile = require("../assets/sounds/warning.mp3")
        break
      default:
        soundFile = require("../assets/sounds/notification.mp3")
    }

    const { sound } = await Audio.Sound.createAsync(soundFile)
    await sound.playAsync()

    // Unload sound after playing
    setTimeout(() => {
      sound.unloadAsync()
    }, 3000)

    return true
  } catch (error) {
    console.error("Error playing notification sound:", error)
    return false
  }
}

// Set up notification listeners
export const setNotificationListeners = (receivedHandler, responseHandler) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(receivedHandler)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(responseHandler)

  return { receivedSubscription, responseSubscription }
}

// Remove notification listeners
export const removeNotificationListeners = ({ receivedSubscription, responseSubscription }) => {
  if (receivedSubscription) {
    Notifications.removeNotificationSubscription(receivedSubscription)
  }

  if (responseSubscription) {
    Notifications.removeNotificationSubscription(responseSubscription)
  }
}

// Stop all active speech
export const stopSpeech = () => {
  if (Speech.isSpeakingAsync()) {
    Speech.stop()
  }
}
