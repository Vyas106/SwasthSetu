"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { Alert } from "react-native"

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

type FirebaseContextType = {
  firestore: any
  initialized: boolean
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export const FirebaseProvider = ({ children }) => {
  const [app, setApp] = useState(null)
  const [firestore, setFirestore] = useState(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    try {
      // Initialize Firebase
      const firebaseApp = initializeApp(firebaseConfig)
      setApp(firebaseApp)

      // Initialize Firestore
      const db = getFirestore(firebaseApp)
      setFirestore(db)

      setInitialized(true)
    } catch (error) {
      console.error("Error initializing Firebase:", error)
      Alert.alert(
        "Firebase Initialization Error",
        "There was an error connecting to the database. Please check your internet connection and try again.",
      )
    }
  }, [])

  return <FirebaseContext.Provider value={{ firestore, initialized }}>{children}</FirebaseContext.Provider>
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}
