"use client"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"
import { Platform } from "react-native"

type QuickActionsProps = {
  onAddReminder: () => void
  onOpenCamera: () => void
}

export const QuickActions = ({ onAddReminder, onOpenCamera }: QuickActionsProps) => {
  const { theme } = useTheme()
  const { translateUI } = useLanguage()
  const router = useRouter()

  const handlePress = (action: () => void) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    if (typeof action === "function") {
      action()
    } else {
      console.warn("Action is not a function")
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{translateUI("Quick Actions")}</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground }]}
          onPress={() => handlePress(() => router.push("/nearby"))}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
            <Feather name="map-pin" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.colors.text }]}>{translateUI("Nearby")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground }]}
          onPress={() => handlePress(onAddReminder)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
            <Feather name="bell" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.colors.text }]}>{translateUI("Reminder")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground }]}
          onPress={() => handlePress(() => router.push("/food/today"))}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
            <Feather name="coffee" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.colors.text }]}>{translateUI("Food")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground }]}
          onPress={() => handlePress(onOpenCamera)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
            <Feather name="camera" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.actionText, { color: theme.colors.text }]}>{translateUI("See")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "23%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
})
