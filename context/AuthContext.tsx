"use client"

import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { router } from "expo-router"
import { createUser, getUserByName, updateUserProfile } from "@/services/firebase"

type User = {
  id: string
  name: string
  age?: number
  address?: string
  city?: string
  pincode?: string
  description?: string
  profileImage?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (name: string, password: string) => Promise<void>
  signup: (userData: Partial<User>, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const loadUserSession = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user")
        if (userJson) {
          setUser(JSON.parse(userJson))
        }
      } catch (error) {
        console.error("Error loading user session:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserSession()
  }, [])

  const login = async (name: string, password: string) => {
    try {
      // In a real app, this would validate credentials against Firebase Auth
      // For this demo, we're using a custom authentication approach
      const userData = await getUserByName(name)

      if (!userData) {
        throw new Error("User not found")
      }

      // In a real app, you would verify the password hash
      // For this demo, we're just checking if the passwords match
      if (userData.password !== password) {
        throw new Error("Invalid password")
      }

      // Remove password from user data before storing
      const { password: _, ...userWithoutPassword } = userData

      // Store user in state and AsyncStorage
      setUser(userWithoutPassword)
      await AsyncStorage.setItem("user", JSON.stringify(userWithoutPassword))

      return userWithoutPassword
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const signup = async (userData: Partial<User>, password: string) => {
    try {
      // Check if user already exists
      const existingUser = await getUserByName(userData.name)

      if (existingUser) {
        throw new Error("User already exists")
      }

      // Create new user
      const newUser = await createUser({
        ...userData,
        password, // In a real app, this would be hashed
      })

      // Remove password from user data before storing
      const { password: _, ...userWithoutPassword } = newUser

      // Store user in state and AsyncStorage
      setUser(userWithoutPassword)
      await AsyncStorage.setItem("user", JSON.stringify(userWithoutPassword))

      return userWithoutPassword
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Clear user from state and AsyncStorage
      setUser(null)
      await AsyncStorage.removeItem("user")

      // Navigate to login screen
      router.replace("/(auth)/login")
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (!user) {
        throw new Error("No user logged in")
      }

      // Update user profile in Firebase
      const updatedUser = await updateUserProfile(user.id, userData)

      // Update user in state and AsyncStorage
      setUser(updatedUser)
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))

      return updatedUser
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
