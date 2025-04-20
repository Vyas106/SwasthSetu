"use client"

import { StyleSheet, View, Text, TouchableOpacity, Image, Linking } from "react-native"
import { useRouter } from "expo-router"
import { useTheme } from "@/context/ThemeContext"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"
import { Platform } from "react-native"
import * as Haptics from "expo-haptics"

interface NearbyPlacesProps {
  nearbyPlaces: any[]
}

export const NearbyPlaces = ({ nearbyPlaces }: NearbyPlacesProps) => {
  const { theme } = useTheme()
  const router = useRouter()

  const handleViewAll = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    router.push("/nearby")
  }

  const handleOpenMap = (place) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    if (place.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${place.location.latitude},${place.location.longitude}`
      Linking.openURL(url).catch((err) => {
        console.error("Error opening map:", err)
      })
    } else {
      const query = encodeURIComponent(`${place.name}, ${place.address}`)
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`
      Linking.openURL(url).catch((err) => {
        console.error("Error opening map:", err)
      })
    }
  }

  // Get icon based on place type
  const getPlaceIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return "plus-square"
      case "doctor":
        return "user"
      case "pharmacy":
        return "package"
      case "senior_center":
        return "users"
      default:
        return "map-pin"
    }
  }

  // Get top 3 places
  const topPlaces = nearbyPlaces.slice(0, 3)

  return (
    <Animated.View entering={FadeIn.delay(600).duration(800)} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nearby Services</Text>
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: theme.colors.primaryLight }]}
          onPress={handleViewAll}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
          <Feather name="chevron-right" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {topPlaces.length > 0 ? (
        <View style={styles.placesGrid}>
          {topPlaces.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={[styles.placeCard, { backgroundColor: theme.colors.card }]}
              onPress={() => handleOpenMap(place)}
              activeOpacity={0.8}
            >
              <View style={[styles.placeIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Feather name={getPlaceIcon(place.type)} size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.placeName, { color: theme.colors.text }]} numberOfLines={1}>
                {place.name}
              </Text>
              <Text style={[styles.placeDistance, { color: theme.colors.textSecondary }]}>
                {place.distance} km away
              </Text>
              <View style={[styles.placeType, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.placeTypeText, { color: theme.colors.primary }]}>
                  {place.type.charAt(0).toUpperCase() + place.type.slice(1).replace("_", " ")}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}>
          <Image source={require("@/assets/images/empty-places.png")} style={styles.emptyImage} resizeMode="contain" />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No nearby services found. Update your address in profile settings.
          </Text>
          <TouchableOpacity
            style={[styles.updateButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.7}
          >
            <Text style={[styles.updateButtonText, { color: theme.colors.white }]}>Update Address</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewAllText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    marginRight: 4,
  },
  placesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  placeCard: {
    width: "31%",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  placeName: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  placeDistance: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    marginBottom: 8,
  },
  placeType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placeTypeText: {
    fontFamily: "Inter-Medium",
    fontSize: 10,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyText: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  updateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  updateButtonText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
})
