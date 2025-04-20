"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { StyleSheet, View, Text, Animated, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { fetchHealthData, fetchFoodData, fetchNearbyPlaces, fetchReminders } from "@/services/firebase"
import { getAiSuggestions } from "@/services/gemini"
import { useFocusEffect } from "expo-router"
import * as Notifications from "expo-notifications"
import { StatusBar } from "expo-status-bar"
import { Feather } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { Platform } from "react-native"
import * as Haptics from "expo-haptics"

// Import components
import { GreetingSection } from "@/components/home/GreetingSection"
import { QuickActions } from "@/components/home/QuickActions"
import { HealthChart } from "@/components/home/HealthChart"
import { FoodSummary } from "@/components/home/FoodSummary"
import { AiSuggestions } from "@/components/home/AiSuggestions"
import { NearbyPlaces } from "@/components/home/NearbyPlaces"
import { RemindersList } from "@/components/home/RemindersList"
import { AddReminderModal } from "@/components/home/AddReminderModal"
import { ObjectDetectionModal } from "@/components/camera/ObjectDetectionModal"
import { SkeletonLoader } from "@/components/ui/skeleton-loader"

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export default function HomeScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [healthData, setHealthData] = useState(null)
  const [foodData, setFoodData] = useState(null)
  const [suggestions, setSuggestions] = useState("")
  const [nearbyPlaces, setNearbyPlaces] = useState([])
  const [reminders, setReminders] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState({
    health: true,
    food: true,
    suggestions: true,
    places: true,
    reminders: true,
  })
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [cameraModalVisible, setCameraModalVisible] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })
  const greetingTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: "clamp",
  })
  const greetingScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  })

  // Request notification permissions
  useEffect(() => {
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== "granted") {
        console.log("Notification permissions not granted")
      }
    }

    requestNotificationPermissions()
  }, [])

  const loadData = useCallback(async () => {
    if (user) {
      try {
        // Fetch health data
        setLoading((prev) => ({ ...prev, health: true }))
        const health = await fetchHealthData(user.id)
        setHealthData(health)
        setLoading((prev) => ({ ...prev, health: false }))

        // Fetch food data
        setLoading((prev) => ({ ...prev, food: true }))
        const food = await fetchFoodData(user.id)
        setFoodData(food)
        setLoading((prev) => ({ ...prev, food: false }))

        // Get AI suggestions based on health and food data
        setLoading((prev) => ({ ...prev, suggestions: true }))
        if (health && food) {
          const aiSuggestions = await getAiSuggestions(health, food)
          setSuggestions(aiSuggestions)
        }
        setLoading((prev) => ({ ...prev, suggestions: false }))

        // Fetch nearby places based on user's address
        setLoading((prev) => ({ ...prev, places: true }))
        const userAddress = user.address && user.city ? `${user.address}, ${user.city}, ${user.pincode || ""}` : ""
        const places = await fetchNearbyPlaces(userAddress)
        setNearbyPlaces(places)
        setLoading((prev) => ({ ...prev, places: false }))

        // Fetch reminders
        setLoading((prev) => ({ ...prev, reminders: true }))
        const userReminders = await fetchReminders(user.id)
        setReminders(userReminders)
        setLoading((prev) => ({ ...prev, reminders: false }))

        setInitialLoading(false)
      } catch (error) {
        console.error("Error loading home data:", error)
        setLoading({
          health: false,
          food: false,
          suggestions: false,
          places: false,
          reminders: false,
        })
        setInitialLoading(false)
      }
    }
  }, [user])

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData]),
  )

  const onRefresh = useCallback(async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleReminderAdded = (newReminder) => {
    setReminders([newReminder, ...reminders])
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["left", "right"]}>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            backgroundColor: theme.colors.background,
            opacity: headerOpacity,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {Platform.OS === "ios" && (
          <BlurView intensity={80} tint={theme.mode === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        )}
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Home</Text>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <GreetingSection greetingTranslateY={greetingTranslateY} greetingScale={greetingScale} />

        {/* Quick Actions */}
        {/* <QuickActions
          onAddReminder={() => setReminderModalVisible(true)}
          onOpenCamera={() => setCameraModalVisible(true)}
        /> */}

        {/* Health Chart */}
        {loading.health ? <SkeletonLoader type="chart" /> : <HealthChart healthData={healthData} />}

        {/* Food Summary */}
        {loading.food ? <SkeletonLoader type="list" /> : <FoodSummary foodData={foodData} />}

        {/* Reminders List */}
        {loading.reminders ? (
          <SkeletonLoader type="list" />
        ) : (
          <RemindersList reminders={reminders} onAddReminder={() => setReminderModalVisible(true)} />
        )}

        {/* AI Suggestions */}
        {loading.suggestions ? <SkeletonLoader type="text" /> : <AiSuggestions suggestions={suggestions} />}

        {/* Nearby Places */}
        {loading.places ? <SkeletonLoader type="places" /> : <NearbyPlaces nearbyPlaces={nearbyPlaces} />}
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          if (Platform.OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          }
          setReminderModalVisible(true)
        }}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color={theme.colors.white} />
      </TouchableOpacity>

      {/* Add Reminder Modal */}
      <AddReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        onReminderAdded={handleReminderAdded}
      />

      {/* Object Detection Camera Modal */}
      {/* <ObjectDetectionModal visible={cameraModalVisible} onClose={() => setCameraModalVisible(false)} /> */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    zIndex: 100,
  },
  headerTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    fontFamily: "Inter-Regular",
    marginTop: 16,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
})
