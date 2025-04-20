"use client"

import React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useColorScheme, Appearance, Text } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Define theme colors for elderly-friendly visibility
const lightTheme = {
  mode: "light",
  colors: {
    primary: "#4E7AC7", // Softer blue that's still visible
    primaryLight: "#E6EEF9",
    secondary: "#6C63FF",
    background: "#FFFFFF",
    card: "#F8F9FA",
    text: "#333333", // Dark but not pure black for less strain
    textSecondary: "#6B7280",
    border: "#E2E8F0",
    white: "#FFFFFF",
    danger: "#E53E3E",
    warning: "#DD6B20",
    warningLight: "#FEEBDC",
    success: "#38A169",
  },
}

const darkTheme = {
  mode: "dark",
  colors: {
    primary: "#6B8ED0", // Brighter blue for dark mode visibility
    primaryLight: "#2D3748",
    secondary: "#8B83FF",
    background: "#121212",
    card: "#1E1E1E",
    text: "#F7FAFC", // Off-white for less eye strain
    textSecondary: "#A0AEC0",
    border: "#2D3748",
    white: "#FFFFFF",
    danger: "#F56565",
    warning: "#ED8936",
    warningLight: "#3D2F1B",
    success: "#48BB78",
  },
}

type ThemeContextType = {
  theme: typeof lightTheme
  toggleTheme: () => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  fontSizeScale: number
  getFontSize: (size: number) => number
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme()
  const [theme, setTheme] = useState(colorScheme === "dark" ? darkTheme : lightTheme)
  const [fontSizeScale, setFontSizeScale] = useState(1)

  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem("themeMode")
        const savedFontSize = await AsyncStorage.getItem("fontSize")

        if (savedThemeMode) {
          setTheme(savedThemeMode === "dark" ? darkTheme : lightTheme)
        }

        if (savedFontSize) {
          setFontSizeScale(Number.parseFloat(savedFontSize))
        }
      } catch (error) {
        console.error("Error loading theme preferences:", error)
      }
    }

    loadThemePreference()

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setTheme(colorScheme === "dark" ? darkTheme : lightTheme)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const toggleTheme = async () => {
    const newTheme = theme.mode === "light" ? darkTheme : lightTheme
    setTheme(newTheme)

    try {
      await AsyncStorage.setItem("themeMode", newTheme.mode)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  const increaseFontSize = async () => {
    if (fontSizeScale < 1.5) {
      const newScale = fontSizeScale + 0.1
      setFontSizeScale(newScale)

      try {
        await AsyncStorage.setItem("fontSize", newScale.toString())
      } catch (error) {
        console.error("Error saving font size preference:", error)
      }
    }
  }

  const decreaseFontSize = async () => {
    if (fontSizeScale > 0.8) {
      const newScale = fontSizeScale - 0.1
      setFontSizeScale(newScale)

      try {
        await AsyncStorage.setItem("fontSize", newScale.toString())
      } catch (error) {
        console.error("Error saving font size preference:", error)
      }
    }
  }

  const resetFontSize = async () => {
    setFontSizeScale(1)

    try {
      await AsyncStorage.setItem("fontSize", "1")
    } catch (error) {
      console.error("Error saving font size preference:", error)
    }
  }

  const getFontSize = (size: number) => {
    return size * fontSizeScale
  }

  // Override Text component to apply font scaling
  useEffect(() => {
    const originalRender = Text.render
    Text.render = function (...args) {
      const originResult = originalRender.apply(this, args)
      const { style } = originResult.props
      const fontSize = style?.fontSize

      if (fontSize) {
        return React.cloneElement(originResult, {
          style: [style, { fontSize: fontSize * fontSizeScale }],
        })
      }
      return originResult
    }

    return () => {
      Text.render = originalRender
    }
  }, [fontSizeScale])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        fontSizeScale,
        getFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
