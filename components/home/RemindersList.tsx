"use client"

import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native"
import { useRouter } from "expo-router"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"
import { Platform } from "react-native"
import * as Haptics from "expo-haptics"

interface RemindersListProps {
  reminders: any[]
  onAddReminder: () => void
}

export const RemindersList = ({ reminders, onAddReminder }: RemindersListProps) => {
  const { theme } = useTheme()
  const { translateUI } = useLanguage()
  const router = useRouter()

  const handleAddReminder = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onAddReminder()
  }

  const handleViewAll = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    router.push("/reminder")
  }

  // Get upcoming reminders (not completed)
  const upcomingReminders = reminders.filter((reminder) => !reminder.isCompleted).slice(0, 3)

  return (
    <Animated.View entering={FadeIn.delay(500).duration(800)} style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{translateUI("Reminders")}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
              {upcomingReminders.length} {translateUI("upcoming")}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primaryLight }]}
              onPress={handleViewAll}
              activeOpacity={0.7}
            >
              <Feather name="list" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primaryLight, marginLeft: 8 }]}
              onPress={handleAddReminder}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {upcomingReminders.length > 0 ? (
          <View style={styles.remindersList}>
            {upcomingReminders.map((reminder, index) => {
              const reminderDate = new Date(reminder.dateTime)
              const isToday = new Date().toDateString() === reminderDate.toDateString()

              // Get icon based on reminder type
              let typeIcon = "bell"
              if (reminder.type === "medication") typeIcon = "package"
              else if (reminder.type === "appointment") typeIcon = "calendar"
              else if (reminder.type === "daily") typeIcon = "repeat"
              else if (reminder.type === "weekly") typeIcon = "calendar"

              return (
                <View
                  key={reminder.id}
                  style={[
                    styles.reminderItem,
                    {
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index < upcomingReminders.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <View style={styles.reminderItemLeft}>
                    <View
                      style={[
                        styles.reminderIcon,
                        {
                          backgroundColor:
                            reminder.type === "medication"
                              ? theme.colors.dangerLight
                              : reminder.type === "appointment"
                                ? theme.colors.successLight
                                : theme.colors.primaryLight,
                        },
                      ]}
                    >
                      <Feather
                        name={typeIcon}
                        size={16}
                        color={
                          reminder.type === "medication"
                            ? theme.colors.danger
                            : reminder.type === "appointment"
                              ? theme.colors.success
                              : theme.colors.primary
                        }
                      />
                    </View>
                    <View style={styles.reminderItemInfo}>
                      <Text style={[styles.reminderItemTitle, { color: theme.colors.text }]}>{reminder.title}</Text>
                      <Text style={[styles.reminderItemTime, { color: theme.colors.textSecondary }]}>
                        {isToday
                          ? `${translateUI("Today")}, ${reminderDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : reminderDate.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.reminderTypeBadge,
                      {
                        backgroundColor:
                          reminder.type === "medication"
                            ? theme.colors.dangerLight
                            : reminder.type === "appointment"
                              ? theme.colors.successLight
                              : theme.colors.primaryLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reminderTypeText,
                        {
                          color:
                            reminder.type === "medication"
                              ? theme.colors.danger
                              : reminder.type === "appointment"
                                ? theme.colors.success
                                : theme.colors.primary,
                        },
                      ]}
                    >
                      {reminder.type ? `${reminder.type.charAt(0).toUpperCase()}${reminder.type.slice(1)}` : "One-time"}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={require("@/assets/images/empty-reminders.png")}
              style={styles.emptyStateImage}
              resizeMode="contain"
            />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              {translateUI("No upcoming reminders")}
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddReminder}
              activeOpacity={0.7}
            >
              <Text style={[styles.emptyStateButtonText, { color: theme.colors.white }]}>
                {translateUI("Add Reminder")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
  },
  cardSubtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  remindersList: {
    marginTop: 8,
  },
  reminderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  reminderItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reminderItemInfo: {
    flex: 1,
  },
  reminderItemTitle: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
  },
  reminderItemTime: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    marginTop: 4,
  },
  reminderTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reminderTypeText: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyStateImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyStateText: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
})
