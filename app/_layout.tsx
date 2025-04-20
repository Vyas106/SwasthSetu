"use client"

import { useEffect, useState, useCallback } from "react"
import { Stack } from "expo-router"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"
import { FirebaseProvider } from "@/context/FirebaseContext"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { LanguageProvider } from "@/context/LanguageContext"
import { View, Text } from "react-native"

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false)


  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (e) {
        console.warn("Error in layout preparation:", e)
      } finally {
        // Tell the application to render
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady ) {
      // Hide splash screen
      await SplashScreen.hideAsync().catch(() => {
        /* ignore error */
      })
    }
  }, [appIsReady])

  useEffect(() => {
    if (appIsReady ) {
      // Hide splash screen when ready
      SplashScreen.hideAsync().catch(() => {
        /* ignore error */
      })
    }
  }, [appIsReady])

  if (!appIsReady ) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading application...</Text>
      </View>
    )
  }

  // If there was a font loading error, we should still render the app
  // but log the error for debugging

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <FirebaseProvider>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </FirebaseProvider>
    </SafeAreaProvider>
  )
}
