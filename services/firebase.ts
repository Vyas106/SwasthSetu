import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import { getFirestore } from "firebase/firestore"
import * as Location from "expo-location"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import * as FileSystem from "expo-file-system"
import Constants from 'expo-constants';



const mockHealthData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      data: [65, 68, 66, 70, 69, 72, 71],
      color: () => "#4E7AC7",
      strokeWidth: 2,
    },
  ],
}


const mockFoodData = {
  todayItems: [
    {
      id: "1",
      name: "Breakfast - Oatmeal with fruits",
      time: "8:30 AM",
      calories: 350,
      imageUrl: null,
    },
    {
      id: "2",
      name: "Lunch - Grilled chicken salad",
      time: "1:00 PM",
      calories: 550,
      imageUrl: null,
    },
  ],
  totalCalories: 900,
}

const mockFoodDays = [
  {
    date: new Date(),
    formattedDate: "Today",
    totalCalories: 900,
    items: [
      {
        id: "1",
        name: "Breakfast - Oatmeal with fruits",
        time: "8:30 AM",
        calories: 350,
        imageUrl: null,
      },
      {
        id: "2",
        name: "Lunch - Grilled chicken salad",
        time: "1:00 PM",
        calories: 550,
        imageUrl: null,
      },
    ],
  },
]


const mockMedicalReports = [
  {
    id: "1",
    title: "Annual Health Checkup",
    date: "2023-12-15",
    doctor: "Dr. Sarah Johnson",
    hospital: "City General Hospital",
    summary: "Overall health is good. Blood pressure is normal. Cholesterol levels are within acceptable range.",
    fileUrl: null,
    metrics: {
      bloodPressure: "120/80",
      heartRate: "72 bpm",
      cholesterol: "180 mg/dL",
      bloodSugar: "95 mg/dL",
    },
  },
]

const mockEmergencyContacts = [
  {
    id: "1",
    name: "John Smith",
    relationship: "Son",
    phone: "+1 (555) 123-4567",
  },
]

const mockNearbyPlaces = [
  {
    id: "1",
    name: "City General Hospital",
    type: "hospital",
    distance: 1.2,
    address: "123 Main St",
    phone: "+1 (555) 123-4567",
    rating: 4.5,
    location: {
      latitude: 28.6139,
      longitude: 77.209,
    },
  },
  {
    id: "2",
    name: "Dr. Sarah Johnson",
    type: "doctor",
    distance: 0.8,
    address: "456 Oak Ave",
    phone: "+1 (555) 987-6543",
    rating: 4.8,
    location: {
      latitude: 28.6219,
      longitude: 77.211,
    },
  },
  {
    id: "3",
    name: "Community Pharmacy",
    type: "pharmacy",
    distance: 0.5,
    address: "789 Elm St",
    phone: "+1 (555) 456-7890",
    rating: 4.2,
    location: {
      latitude: 28.6159,
      longitude: 77.215,
    },
  },
  {
    id: "4",
    name: "Senior Community Center",
    type: "senior_center",
    distance: 1.5,
    address: "101 Pine Rd",
    phone: "+1 (555) 234-5678",
    rating: 4.6,
    location: {
      latitude: 28.6109,
      longitude: 77.205,
    },
  },
]

const mockReminders = [
  {
    id: "1",
    title: "Take Blood Pressure Medication",
    description: "Take 1 tablet with water after breakfast",
    dateTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    isCompleted: false,
    notificationId: "reminder-1",
  },
  {
    id: "2",
    title: "Doctor Appointment",
    description: "Annual checkup with Dr. Johnson",
    dateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    isCompleted: false,
    notificationId: "reminder-2",
  },
  {
    id: "3",
    title: "Refill Prescription",
    description: "Call pharmacy to refill heart medication",
    dateTime: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // Yesterday
    isCompleted: true,
    notificationId: "",
  },
]




// User Management
export const createUser = async (userData) => {
  try {
    const db = getFirestore()
    const userRef = collection(db, "users")

    // Create user document
    const docRef = await addDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...userData,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export const getUserByName = async (name) => {
  try {
    const db = getFirestore()
    const userRef = collection(db, "users")

    const q = query(userRef, where("name", "==", name), limit(1))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const userDoc = querySnapshot.docs[0]
    return {
      id: userDoc.id,
      ...userDoc.data(),
    }
  } catch (error) {
    console.error("Error getting user by name:", error)
    throw error
  }
}

export const updateUserProfile = async (userId, userData) => {
  try {
    const db = getFirestore()
    const userRef = doc(db, "users", userId)

    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    })

    const updatedDoc = await getDoc(userRef)
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

export const updateUserSettings = async (userId, settings) => {
  try {
    const db = getFirestore()
    const settingsRef = doc(db, "users", userId, "settings", "preferences")

    await setDoc(
      settingsRef,
      {
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return settings
  } catch (error) {
    console.error("Error updating user settings:", error)
    throw error
  }
}

// Health Data
export const fetchHealthData = async (userId) => {
  try {
    const db = getFirestore()
    const healthRef = collection(db, "users", userId, "health")

    const q = query(healthRef, orderBy("date", "desc"), limit(7))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Generate some initial health data if none exists
      const today = new Date()
      const healthData = {
        labels: [],
        datasets: [
          {
            data: [],
            color: () => "#4E7AC7",
            strokeWidth: 2,
          },
        ],
      }

      // Generate data for the past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)

        // Generate a random health value between 65-75
        const value = Math.floor(Math.random() * 10) + 65

        // Add to health data
        healthData.labels.push(date.toLocaleDateString("en-US", { weekday: "short" }))
        healthData.datasets[0].data.push(value)

        // Save to database
        await addDoc(healthRef, {
          value,
          date: Timestamp.fromDate(date),
        })
      }

      return healthData
    }

    // Process health data for chart
    const healthData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
    }))

    const sortedData = [...healthData].sort((a, b) => a.date - b.date)

    // Get day labels
    const labels = sortedData.map((data) => {
      return data.date.toLocaleDateString("en-US", { weekday: "short" })
    })

    // Format data for chart
    return {
      labels,
      datasets: [
        {
          data: sortedData.map((data) => data.value),
          color: () => "#4E7AC7",
          strokeWidth: 2,
        },
      ],
    }
  } catch (error) {
    console.error("Error fetching health data:", error)
    throw error
  }
}

export const addHealthData = async (userId, value) => {
  try {
    const db = getFirestore()
    const healthRef = collection(db, "users", userId, "health")

    const docRef = await addDoc(healthRef, {
      value,
      date: serverTimestamp(),
    })

    return {
      id: docRef.id,
      value,
      date: new Date(),
    }
  } catch (error) {
    console.error("Error adding health data:", error)
    throw error
  }
}

// Food Data
export const fetchFoodData = async (userId: string) => {
  // Mock food data
  return {
    meals: [
      {
        id: "meal1",
        name: "Breakfast",
        time: "08:00 AM",
        items: ["Oatmeal with fruits", "Green tea"],
        calories: 320,
        protein: 12,
        carbs: 45,
        fat: 8,
      },
      {
        id: "meal2",
        name: "Lunch",
        time: "12:30 PM",
        items: ["Vegetable salad", "Grilled chicken", "Brown rice"],
        calories: 450,
        protein: 35,
        carbs: 40,
        fat: 15,
      },
      {
        id: "meal3",
        name: "Snack",
        time: "04:00 PM",
        items: ["Greek yogurt", "Mixed nuts"],
        calories: 200,
        protein: 15,
        carbs: 10,
        fat: 12,
      },
    ],
    totalCalories: 970,
    totalProtein: 62,
    totalCarbs: 95,
    totalFat: 35,
    waterIntake: 1800,
  }
}

export const fetchFoodDays = async (userId) => {
  try {
    const db = getFirestore()
    const foodRef = collection(db, "users", userId, "food")

    // Get all food entries from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const q = query(foodRef, where("date", ">=", Timestamp.fromDate(sevenDaysAgo)), orderBy("date", "desc"))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    // Group entries by day
    const entriesByDay = {}
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const date = data.date?.toDate() || new Date()
      const dateString = date.toDateString()

      if (!entriesByDay[dateString]) {
        entriesByDay[dateString] = {
          date: new Date(date),
          formattedDate: formatDate(date),
          items: [],
          totalCalories: 0,
        }
      }

      const entry = {
        id: doc.id,
        ...data,
        date: date,
      }

      entriesByDay[dateString].items.push(entry)
      entriesByDay[dateString].totalCalories += entry.calories || 0
    })

    // Convert to array and sort by date (newest first)
    return Object.values(entriesByDay).sort((a, b) => b.date - a.date)
  } catch (error) {
    console.error("Error fetching food days:", error)
    throw error
  }
}

const formatDate = (date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }
}

export const saveFoodEntry = async (userId, foodEntry) => {
  try {
    const db = getFirestore()
    const foodRef = collection(db, "users", userId, "food")

    const docRef = await addDoc(foodRef, {
      ...foodEntry,
      date: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...foodEntry,
    }
  } catch (error) {
    console.error("Error saving food entry:", error)
    throw error
  }
}

export const uploadFoodImage = async (userId, uri) => {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri)
    if (!fileInfo.exists) {
      throw new Error("File does not exist")
    }

    // Create blob from file
    const response = await fetch(uri)
    const blob = await response.blob()

    // Upload to Firebase Storage
    const storage = getStorage()
    const filename = uri.substring(uri.lastIndexOf("/") + 1)
    const storageRef = ref(storage, `food-images/${userId}/${filename}`)

    await uploadBytes(storageRef, blob)

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error("Error uploading food image:", error)
    throw error
  }
}

export const fetchFoodEntriesByDate = async (userId, date) => {
  try {
    const db = getFirestore()
    const foodRef = collection(db, "users", userId, "food")

    // Set date range for the specified day
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Query for food entries within the date range
    const q = query(
      foodRef,
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
      orderBy("date", "asc"),
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    // Process food entries
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
    }))
  } catch (error) {
    console.error("Error fetching food entries by date:", error)
    throw error
  }
}

export const deleteFoodEntry = async (userId, entryId) => {
  try {
    const db = getFirestore()
    const entryRef = doc(db, "users", userId, "food", entryId)

    await deleteDoc(entryRef)
    return true
  } catch (error) {
    console.error("Error deleting food entry:", error)
    throw error
  }
}

// Add this function to the firebase.ts file
export const analyzeFoodImage = async (imageUrl) => {
  try {
    // In a real implementation, this would call the Gemini API
    // For now, we'll simulate a response with detailed food information

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      name: "Grilled Chicken Salad with Avocado",
      calories: 420,
      nutritionalInfo: {
        protein: 35,
        carbs: 15,
        fat: 25,
        fiber: 8,
        sugar: 3,
        sodium: 320,
        vitamins: ["Vitamin A", "Vitamin C", "Vitamin K", "Vitamin E"],
        minerals: ["Potassium", "Iron", "Calcium", "Magnesium"],
      },
      ingredients: [
        "Grilled chicken breast",
        "Mixed greens",
        "Avocado",
        "Cherry tomatoes",
        "Cucumber",
        "Red onion",
        "Olive oil",
        "Lemon juice",
        "Salt and pepper",
      ],
      preparation:
        "The chicken appears to be grilled and seasoned with herbs. The salad is dressed with a light olive oil and lemon dressing. The avocado is sliced and placed on top of the mixed greens.",
      healthBenefits: [
        "High in protein for muscle maintenance",
        "Contains healthy fats from avocado",
        "Rich in fiber for digestive health",
        "Low in carbohydrates, suitable for low-carb diets",
        "Contains antioxidants from fresh vegetables",
      ],
      nutritionalWarning: null,
      mealType: "Lunch/Dinner",
      cuisineType: "Mediterranean-inspired",
      dietaryInfo: {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true,
        isDairyFree: true,
        isNutFree: true,
      },
    }
  } catch (error) {
    console.error("Error analyzing food image:", error)
    throw error
  }
}

// Medical Reports
export const saveMedicalReport = async (userId, reportData) => {
  try {
    const db = getFirestore()
    const reportsRef = collection(db, "users", userId, "medicalReports")

    const docRef = await addDoc(reportsRef, {
      ...reportData,
      date: reportData.date || new Date().toISOString().split("T")[0],
      createdAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...reportData,
    }
  } catch (error) {
    console.error("Error saving medical report:", error)
    throw error
  }
}

export const fetchMedicalReports = async (userId) => {
  try {
    const db = getFirestore()
    const reportsRef = collection(db, "users", userId, "medicalReports")

    const q = query(reportsRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching medical reports:", error)
    throw error
  }
}

export const fetchMedicalReportById = async (userId, reportId) => {
  try {
    const db = getFirestore()
    const reportRef = doc(db, "users", userId, "medicalReports", reportId)

    const reportDoc = await getDoc(reportRef)

    if (!reportDoc.exists()) {
      throw new Error("Medical report not found")
    }

    return {
      id: reportDoc.id,
      ...reportDoc.data(),
    }
  } catch (error) {
    console.error("Error fetching medical report:", error)
    throw error
  }
}

export const deleteMedicalReport = async (userId, reportId) => {
  try {
    const db = getFirestore()
    const reportRef = doc(db, "users", userId, "medicalReports", reportId)

    await deleteDoc(reportRef)
    return true
  } catch (error) {
    console.error("Error deleting medical report:", error)
    throw error
  }
}

// Nearby Places
export const fetchNearbyPlaces = async (address: string, userLocation: any = null) => {
  try {
    // Use Google Places API to fetch real nearby places
    const GOOGLE_MAPS_API_KEY = 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API Key is missing. Using mock data instead.")
      return mockNearbyPlaces
    }

    let latitude, longitude

    // If we have user location coordinates, use them directly
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      latitude = userLocation.latitude
      longitude = userLocation.longitude
    }
    // Otherwise try to geocode the address
    else if (address) {
      // Geocode the address to get coordinates
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      const geocodeResponse = await fetch(geocodeUrl)
      const geocodeData = await geocodeResponse.json()

      if (geocodeData.status === "OK" && geocodeData.results && geocodeData.results.length > 0) {
        const location = geocodeData.results[0].geometry.location
        latitude = location.lat
        longitude = location.lng
      } else {
        console.warn("Geocoding failed. Using mock data instead.")
        return mockNearbyPlaces
      }
    } else {
      console.warn("No location provided. Using mock data instead.")
      return mockNearbyPlaces
    }

    // Types of places to search for
    const placeTypes = ["hospital", "doctor", "pharmacy", "senior_center"]
    let allPlaces = []

    // Make separate requests for each place type
    for (const type of placeTypes) {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=${type}&key=${GOOGLE_MAPS_API_KEY}`

      const placesResponse = await fetch(placesUrl)
      const placesData = await placesResponse.json()

      if (placesData.status === "OK" && placesData.results) {
        // Process and add places to our results
        const places = placesData.results.map((place) => {
          // Calculate distance
          const placeLocation = {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }
          const distance = calculateDistance({ latitude, longitude }, placeLocation)

          return {
            id: place.place_id,
            name: place.name,
            type: type,
            distance: distance,
            address: place.vicinity,
            phone: place.formatted_phone_number || "Not available",
            rating: place.rating || null,
            location: placeLocation,
          }
        })

        allPlaces = [...allPlaces, ...places]
      }
    }

    // Sort places by distance
    allPlaces.sort((a, b) => a.distance - b.distance)

    // Return the places or mock data if no results
    return allPlaces.length > 0 ? allPlaces : mockNearbyPlaces
  } catch (error) {
    console.error("Error fetching nearby places:", error)
    return mockNearbyPlaces
  }
}

// Helper function to calculate distance between two coordinates (in km)
const calculateDistance = (coord1, coord2) => {
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

// Emergency Contacts
export const saveEmergencyContact = async (userId, contactData) => {
  try {
    const db = getFirestore()
    const contactsRef = collection(db, "users", userId, "emergencyContacts")

    const docRef = await addDoc(contactsRef, {
      ...contactData,
      createdAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...contactData,
    }
  } catch (error) {
    console.error("Error saving emergency contact:", error)
    throw error
  }
}

export const fetchEmergencyContacts = async (userId) => {
  try {
    const db = getFirestore()
    const contactsRef = collection(db, "users", userId, "emergencyContacts")

    const q = query(contactsRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching emergency contacts:", error)
    throw error
  }
}

export const deleteEmergencyContact = async (userId, contactId) => {
  try {
    const db = getFirestore()
    const contactRef = doc(db, "users", userId, "emergencyContacts", contactId)

    await deleteDoc(contactRef)
    return true
  } catch (error) {
    console.error("Error deleting emergency contact:", error)
    throw error
  }
}

// Reminders
export const saveReminder = async (userId, reminderData) => {
  try {
    const db = getFirestore()
    const remindersRef = collection(db, "users", userId, "reminders")

    const docRef = await addDoc(remindersRef, {
      ...reminderData,
      createdAt: serverTimestamp(),
    })

    return {
      id: docRef.id,
      ...reminderData,
    }
  } catch (error) {
    console.error("Error saving reminder:", error)
    throw error
  }
}

export const fetchReminders = async (userId) => {
  try {
    const db = getFirestore()
    const remindersRef = collection(db, "users", userId, "reminders")

    const q = query(remindersRef, orderBy("dateTime", "asc"))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dateTime: doc.data().dateTime?.toDate ? doc.data().dateTime.toDate() : new Date(doc.data().dateTime),
    }))
  } catch (error) {
    console.error("Error fetching reminders:", error)
    throw error
  }
}

export const updateReminder = async (userId, reminderId, reminderData) => {
  try {
    const db = getFirestore()
    const reminderRef = doc(db, "users", userId, "reminders", reminderId)

    await updateDoc(reminderRef, {
      ...reminderData,
      updatedAt: serverTimestamp(),
    })

    return {
      id: reminderId,
      ...reminderData,
    }
  } catch (error) {
    console.error("Error updating reminder:", error)
    throw error
  }
}

export const deleteReminder = async (userId, reminderId) => {
  try {
    const db = getFirestore()
    const reminderRef = doc(db, "users", userId, "reminders", reminderId)

    await deleteDoc(reminderRef)
    return true
  } catch (error) {
    console.error("Error deleting reminder:", error)
    throw error
  }
}
