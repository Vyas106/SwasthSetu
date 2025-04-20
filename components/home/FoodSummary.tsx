"use client"

import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native"
import { useRouter } from "expo-router"
import { useTheme } from "@/context/ThemeContext"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"
import { Platform } from "react-native"
import * as Haptics from "expo-haptics"

interface FoodSummaryProps {
  foodData: any
}

export const FoodSummary = ({ foodData }: FoodSummaryProps) => {
  const { theme } = useTheme()
  const router = useRouter()

  const handleAddMeal = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    router.push("/food")
  }

  const handleViewAll = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    router.push("/food")
  }

  // Get food icon based on name
  const getFoodIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("breakfast")) return "coffee"
    if (lowerName.includes("lunch")) return "box"
    if (lowerName.includes("dinner")) return "moon"
    if (lowerName.includes("snack")) return "cookie"
    return "coffee"
  }

  return (
    <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Today's Nutrition</Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primaryLight }]}
            onPress={handleAddMeal}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {foodData && foodData.todayItems && foodData.todayItems.length > 0 ? (
          <View style={styles.foodList}>
            {foodData.todayItems.slice(0, 3).map((item, index) => (
              <View
                key={index}
                style={[
                  styles.foodItem,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: index < Math.min(foodData.todayItems.length, 3) - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.foodItemLeft}>
                  <View style={[styles.foodIcon, { backgroundColor: theme.colors.primaryLight }]}>
                    <Feather name={getFoodIcon(item.name)} size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.foodItemInfo}>
                    <Text style={[styles.foodItemName, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.foodItemTime, { color: theme.colors.textSecondary }]}>{item.time}</Text>
                  </View>
                </View>
                <Text style={[styles.foodItemCalories, { color: theme.colors.primary }]}>{item.calories} cal</Text>
              </View>
            ))}

            {foodData.todayItems.length > 3 && (
              <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewAll} activeOpacity={0.7}>
                <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>
                  View {foodData.todayItems.length - 3} more items
                </Text>
              </TouchableOpacity>
            )}

            <View style={[styles.totalCalories, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.totalCaloriesText, { color: theme.colors.text }]}>Total Calories</Text>
              <View style={[styles.caloriesBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.totalCaloriesValue, { color: theme.colors.white }]}>
                  {foodData.totalCalories || 0} cal
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={require("@/assets/images/empty-food.png")}
              style={styles.emptyStateImage}
              resizeMode="contain"
            />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>No meals logged today</Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddMeal}
              activeOpacity={0.7}
            >
              <Text style={[styles.emptyStateButtonText, { color: theme.colors.white }]}>Add a meal</Text>
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
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  foodList: {
    marginTop: 8,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  foodItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  foodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
  },
  foodItemTime: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    marginTop: 4,
  },
  foodItemCalories: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
  },
  viewMoreButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  viewMoreText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  totalCalories: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalCaloriesText: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
  },
  caloriesBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  totalCaloriesValue: {
    fontFamily: "Inter-Bold",
    fontSize: 14,
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
