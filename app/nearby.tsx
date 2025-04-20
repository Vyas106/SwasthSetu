"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  TextInput,
  Animated,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { fetchNearbyPlaces } from "@/services/firebase"
import type { NearbyPlace } from "@/types"
import { useRouter } from "expo-router"
import * as Location from "expo-location"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"

export default function NearbyScreen() {
  const { theme, getFontSize } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const mapRef = useRef(null)

  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState(null)
  const [mapVisible, setMapVisible] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null)

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current
  const mapAnimation = useRef(new Animated.Value(0)).current

  const loadNearbyPlaces = useCallback(async () => {
    try {
      setLoading(true)

      // Get user's location
      let location = null
      let address = ""

      // First try to get current location
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()

        if (status === "granted") {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })

          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }

          setUserLocation(location)
        }
      } catch (error) {
        console.error("Error getting current location:", error)
      }

      // If location permission denied or error occurred, try to use user's address
      if (!location && user && user.address && user.city) {
        address = `${user.address}, ${user.city}, ${user.pincode || ""}`
      }

      // Fetch nearby places
      const places = await fetchNearbyPlaces(address, location)
      setNearbyPlaces(places)
      setFilteredPlaces(places)
    } catch (error) {
      console.error("Error loading nearby places:", error)
      Alert.alert("Error", "Failed to load nearby places. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNearbyPlaces()
  }, [loadNearbyPlaces])

  useEffect(() => {
    // Apply filters and search
    let result = nearbyPlaces

    // Apply type filter
    if (filterType) {
      result = result.filter((place) => place.type === filterType)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (place) =>
          place.name.toLowerCase().includes(query) ||
          place.address.toLowerCase().includes(query) ||
          place.type.toLowerCase().includes(query),
      )
    }

    setFilteredPlaces(result)
  }, [filterType, searchQuery, nearbyPlaces])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadNearbyPlaces()
    setRefreshing(false)
  }, [loadNearbyPlaces])

  const handleOpenMap = (place: NearbyPlace) => {
    if (place.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${place.location.latitude},${place.location.longitude}`
      Linking.openURL(url).catch((err) => {
        console.error("Error opening map:", err)
        Alert.alert("Error", "Could not open maps application")
      })
    } else {
      const query = encodeURIComponent(`${place.name}, ${place.address}`)
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`
      Linking.openURL(url).catch((err) => {
        console.error("Error opening map:", err)
        Alert.alert("Error", "Could not open maps application")
      })
    }
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`)
  }

  const toggleMapView = () => {
    if (!mapVisible && userLocation) {
      // Show map
      Animated.timing(mapAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setMapVisible(true)
      })
    } else {
      // Hide map
      Animated.timing(mapAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setMapVisible(false)
      })
    }
  }

  const handleSelectPlace = (place: NearbyPlace) => {
    setSelectedPlace(place)

    // If map is visible, animate to the selected place
    if (mapVisible && mapRef.current && place.location) {
      mapRef.current.animateToRegion(
        {
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      )
    }
  }

  const renderPlaceItem = ({ item, index }: { item: NearbyPlace; index: number }) => {
    const isSelected = selectedPlace?.id === item.id

    return (
      <TouchableOpacity
        style={[
          styles.placeCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: isSelected ? theme.colors.primary : "transparent",
            borderWidth: isSelected ? 2 : 0,
          },
        ]}
        onPress={() => handleSelectPlace(item)}
      >
        <View style={styles.placeHeader}>
          <View style={[styles.placeIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Feather
              name={
                item.type === "hospital"
                  ? "plus-square"
                  : item.type === "doctor"
                    ? "user"
                    : item.type === "pharmacy"
                      ? "package"
                      : "users"
              }
              size={24}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.placeInfo}>
            <Text style={[styles.placeName, { color: theme.colors.text, fontSize: getFontSize(18) }]}>{item.name}</Text>
            <Text style={[styles.placeType, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1).replace("_", " ")}
            </Text>
          </View>
          {item.rating && (
            <View style={[styles.ratingBadge, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.ratingText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
                {item.rating.toFixed(1)}
              </Text>
              <Feather name="star" size={12} color={theme.colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.placeDetails}>
          <View style={styles.detailItem}>
            <Feather name="map-pin" size={16} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
              {item.address}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Feather name="navigation" size={16} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
              {item.distance} km away
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Feather name="phone" size={16} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
              {item.phone}
            </Text>
          </View>
        </View>

        <View style={styles.placeActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primaryLight }]}
            onPress={() => handleCall(item.phone)}
          >
            <Feather name="phone" size={20} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleOpenMap(item)}
          >
            <Feather name="map" size={20} color={theme.colors.white} />
            <Text style={[styles.actionText, { color: theme.colors.white, fontSize: getFontSize(14) }]}>
              Directions
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  // Calculate map height based on animation value
  const mapHeight = mapAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: getFontSize(24) }]}>
          Nearby Services
        </Text>
        <TouchableOpacity onPress={toggleMapView} disabled={!userLocation}>
          <Feather
            name={mapVisible ? "list" : "map"}
            size={24}
            color={userLocation ? theme.colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
          <Feather name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search nearby places..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, !filterType && { backgroundColor: theme.colors.primary }]}
            onPress={() => setFilterType(null)}
          >
            <Text
              style={[
                styles.filterText,
                { color: !filterType ? theme.colors.white : theme.colors.text, fontSize: getFontSize(14) },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === "hospital" && { backgroundColor: theme.colors.primary }]}
            onPress={() => setFilterType("hospital")}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filterType === "hospital" ? theme.colors.white : theme.colors.text,
                  fontSize: getFontSize(14),
                },
              ]}
            >
              Hospitals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === "doctor" && { backgroundColor: theme.colors.primary }]}
            onPress={() => setFilterType("doctor")}
          >
            <Text
              style={[
                styles.filterText,
                { color: filterType === "doctor" ? theme.colors.white : theme.colors.text, fontSize: getFontSize(14) },
              ]}
            >
              Doctors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === "pharmacy" && { backgroundColor: theme.colors.primary }]}
            onPress={() => setFilterType("pharmacy")}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filterType === "pharmacy" ? theme.colors.white : theme.colors.text,
                  fontSize: getFontSize(14),
                },
              ]}
            >
              Pharmacies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === "senior_center" && { backgroundColor: theme.colors.primary }]}
            onPress={() => setFilterType("senior_center")}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filterType === "senior_center" ? theme.colors.white : theme.colors.text,
                  fontSize: getFontSize(14),
                },
              ]}
            >
              Senior Centers
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map View */}
      <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
        {userLocation && (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {filteredPlaces.map(
              (place) =>
                place.location && (
                  <Marker
                    key={place.id}
                    coordinate={{
                      latitude: place.location.latitude,
                      longitude: place.location.longitude,
                    }}
                    title={place.name}
                    description={place.type}
                    onPress={() => handleSelectPlace(place)}
                  >
                    <View
                      style={[
                        styles.markerContainer,
                        {
                          backgroundColor: selectedPlace?.id === place.id ? theme.colors.primary : theme.colors.card,
                        },
                      ]}
                    >
                      <Feather
                        name={
                          place.type === "hospital"
                            ? "plus-square"
                            : place.type === "doctor"
                              ? "user"
                              : place.type === "pharmacy"
                                ? "package"
                                : "users"
                        }
                        size={16}
                        color={selectedPlace?.id === place.id ? theme.colors.white : theme.colors.primary}
                      />
                    </View>
                  </Marker>
                ),
            )}
          </MapView>
        )}
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : filteredPlaces.length > 0 ? (
        <Animated.FlatList
          data={filteredPlaces}
          renderItem={renderPlaceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="map-pin" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
            No Places Found
          </Text>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
            {searchQuery.length > 0
              ? "No results match your search. Try different keywords."
              : user?.address
                ? "We couldn't find any nearby places. Try updating your address or refreshing."
                : "Please update your address in your profile to find nearby places."}
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
            onPress={
              searchQuery.length > 0
                ? () => setSearchQuery("")
                : user?.address
                  ? onRefresh
                  : () => router.push("/profile")
            }
          >
            <Text style={[styles.emptyStateButtonText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
              {searchQuery.length > 0 ? "Clear Search" : user?.address ? "Refresh" : "Update Address"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selected Place Card for Map View */}
      {mapVisible && selectedPlace && (
        <View style={[styles.selectedPlaceCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.selectedPlaceHeader}>
            <View style={styles.selectedPlaceInfo}>
              <Text style={[styles.selectedPlaceName, { color: theme.colors.text }]}>{selectedPlace.name}</Text>
              <Text style={[styles.selectedPlaceType, { color: theme.colors.textSecondary }]}>
                {selectedPlace.type.charAt(0).toUpperCase() + selectedPlace.type.slice(1).replace("_", " ")} •{" "}
                {selectedPlace.distance} km
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPlace(null)}>
              <Feather name="x" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.selectedPlaceActions}>
            <TouchableOpacity
              style={[styles.selectedPlaceAction, { backgroundColor: theme.colors.primaryLight }]}
              onPress={() => handleCall(selectedPlace.phone)}
            >
              <Feather name="phone" size={20} color={theme.colors.primary} />
              <Text style={[styles.selectedPlaceActionText, { color: theme.colors.primary }]}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectedPlaceAction, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleOpenMap(selectedPlace)}
            >
              <Feather name="map" size={20} color={theme.colors.white} />
              <Text style={[styles.selectedPlaceActionText, { color: theme.colors.white }]}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

// ScrollView component for filters
const ScrollView = ({ children, ...props }) => {
  const { theme } = useTheme()

  return (
    <Animated.ScrollView {...props} contentContainerStyle={[props.contentContainerStyle, { paddingRight: 16 }]}>
      {children}
    </Animated.ScrollView>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontFamily: "Inter-Regular",
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  filterScroll: {
    paddingLeft: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  filterText: {
    fontFamily: "Inter-Medium",
  },
  mapContainer: {
    width: "100%",
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  placeCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  placeType: {
    fontFamily: "Inter-Regular",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontFamily: "Inter-Bold",
    marginRight: 4,
  },
  placeDetails: {
    padding: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  placeActions: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionText: {
    fontFamily: "Inter-Bold",
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontFamily: "Inter-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontFamily: "Inter-Bold",
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedPlaceCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedPlaceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  selectedPlaceInfo: {
    flex: 1,
  },
  selectedPlaceName: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    marginBottom: 4,
  },
  selectedPlaceType: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
  },
  selectedPlaceActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  selectedPlaceAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  selectedPlaceActionText: {
    fontFamily: "Inter-Bold",
    marginLeft: 8,
  },
})
