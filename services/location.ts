import * as Location from "expo-location"
import { Alert } from "react-native"

// Request location permissions
export const requestLocationPermissions = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    return status === "granted"
  } catch (error) {
    console.error("Error requesting location permissions:", error)
    return false
  }
}

// Get current location
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermissions()

    if (!hasPermission) {
      Alert.alert("Location Permission Required", "Please grant location permission to use this feature.", [
        { text: "OK" },
      ])
      return null
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }
  } catch (error) {
    console.error("Error getting current location:", error)
    return null
  }
}

// Geocode an address to coordinates
export const geocodeAddress = async (address: string) => {
  try {
    const results = await Location.geocodeAsync(address)
    if (results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      }
    }
    return null
  } catch (error) {
    console.error("Error geocoding address:", error)
    return null
  }
}

// Reverse geocode coordinates to address
export const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude })
    if (results.length > 0) {
      return results[0]
    }
    return null
  } catch (error) {
    console.error("Error reverse geocoding location:", error)
    return null
  }
}

// Calculate distance between two coordinates (in km)
export const calculateDistance = (coord1, coord2) => {
  const R = 6371 // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Number.parseFloat(distance.toFixed(1))
}

// Watch position changes
export const watchPositionChanges = (callback) => {
  try {
    const subscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      },
    )
    return subscription
  } catch (error) {
    console.error("Error watching position changes:", error)
    return null
  }
}

// Stop watching position changes
export const stopWatchingPosition = async (subscription) => {
  if (subscription) {
    await subscription.remove()
  }
}
