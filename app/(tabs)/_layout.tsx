"use client"
import { Tabs } from "expo-router"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { Feather } from "@expo/vector-icons"
import { Platform } from "react-native"
import { BlurView } from "expo-blur"

export default function TabsLayout() {
  const { theme } = useTheme()
  const { translateUI } = useLanguage()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: "Inter-Medium",
          fontSize: 12,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" && theme.mode === "dark" ? (
            <BlurView
              tint="dark"
              intensity={80}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: translateUI("Home"),
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: translateUI("Food"),
          tabBarIcon: ({ color, size }) => <Feather name="coffee" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="medical"
        options={{
          title: translateUI("Medical"),
          tabBarIcon: ({ color, size }) => <Feather name="file-text" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translateUI("Profile"),
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
