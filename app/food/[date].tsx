"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { FoodEntry } from "@/types"
import { fetchFoodEntriesByDate, deleteFoodEntry } from "@/services/firebase"
import { PieChart } from "react-native-chart-kit"

const screenWidth = Dimensions.get("window").width

export default function FoodDateScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const { date } = useLocalSearchParams()

  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [formattedDate, setFormattedDate] = useState("")
  const [totalCalories, setTotalCalories] = useState(0)
  const [nutritionData, setNutritionData] = useState(null)
  const [deleteAnimation] = useState(new Animated.Value(1))
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const loadFoodEntries = async () => {
      if (user && date) {
        try {
          const parsedDate = new Date(date as string)

          // Format date for display
          setFormattedDate(formatDate(parsedDate))

          // Fetch food entries for this date
          const entries = await fetchFoodEntriesByDate(user.id, parsedDate)
          setFoodEntries(entries)

          // Calculate total calories
          const total = entries.reduce((sum, entry) => sum + entry.calories, 0)
          setTotalCalories(total)

          // Generate nutrition data for pie chart
          generateNutritionData(entries)
        } catch (error) {
          console.error("Error loading food entries:", error)
          Alert.alert("Error", "Failed to load food entries. Please try again.")
        } finally {
          setLoading(false)
        }
      }
    }

    loadFoodEntries()
  }, [user, date])

  const formatDate = (date: Date): string => {
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
        month: "long",
        day: "numeric",
      })
    }
  }

  const generateNutritionData = (entries: FoodEntry[]) => {
    if (entries.length === 0) {
      setNutritionData(null)
      return
    }

    // For demo purposes, we'll create a simple breakdown
    // In a real app, you would have actual nutritional data
    const data = [
      {
        name: "Proteins",
        population: Math.round(totalCalories * 0.25),
        color: "#4E7AC7",
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
      {
        name: "Carbs",
        population: Math.round(totalCalories * 0.45),
        color: "#6C63FF",
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
      {
        name: "Fats",
        population: Math.round(totalCalories * 0.3),
        color: "#FF6384",
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      },
    ]

    setNutritionData(data)
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return

    try {
      setDeletingId(entryId)

      // Animate the deletion
      Animated.timing(deleteAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(async () => {
        // Delete from database
        await deleteFoodEntry(user.id, entryId)

        // Update local state
        const updatedEntries = foodEntries.filter((entry) => entry.id !== entryId)
        setFoodEntries(updatedEntries)

        // Recalculate total calories
        const newTotal = updatedEntries.reduce((sum, entry) => sum + entry.calories, 0)
        setTotalCalories(newTotal)

        // Update nutrition data
        generateNutritionData(updatedEntries)

        // Reset animation and ID
        deleteAnimation.setValue(1)
        setDeletingId(null)
      })
    } catch (error) {
      console.error("Error deleting food entry:", error)
      Alert.alert("Error", "Failed to delete food entry. Please try again.")
      setDeletingId(null)
      deleteAnimation.setValue(1)
    }
  }

  const handleShareFoodLog = async () => {
    try {
      const message = `
My Food Log for ${formattedDate}:
${foodEntries.map((entry) => `- ${entry.name}: ${entry.calories} calories (${entry.time})`).join("\n")}

Total Calories: ${totalCalories}
      `.trim()

      await Share.share({
        message,
        title: `Food Log - ${formattedDate}`,
      })
    } catch (error) {
      console.error("Error sharing food log:", error)
      Alert.alert("Error", "Failed to share food log. Please try again.")
    }
  }

  const renderFoodEntry = ({ item }: { item: FoodEntry }) => (
    <Animated.View
      style={[
        styles.foodItem,
        {
          backgroundColor: theme.colors.card,
          opacity: deletingId === item.id ? deleteAnimation : 1,
          transform: [{ scale: deletingId === item.id ? deleteAnimation : 1 }],
        },
      ]}
    >
      <View style={styles.foodHeader}>
        <View style={styles.foodTitleContainer}>
          <Text style={[styles.foodName, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.foodTime, { color: theme.colors.textSecondary }]}>{item.time}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteEntry(item.id)}>
          <Feather name="trash-2" size={20} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>

      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.foodImage} resizeMode="cover" />}

      <View style={styles.nutritionInfo}>
        <View style={styles.calorieContainer}>
          <Text style={[styles.calorieLabel, { color: theme.colors.textSecondary }]}>Calories</Text>
          <Text style={[styles.calorieValue, { color: theme.colors.primary }]}>{item.calories}</Text>
        </View>

        {/* Enhanced Nutrition Information */}
        {item.nutritionalInfo && (
          <View style={styles.macronutrients}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>Protein</Text>
              <Text style={[styles.macroValue, { color: theme.colors.text }]}>{item.nutritionalInfo.protein}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>Carbs</Text>
              <Text style={[styles.macroValue, { color: theme.colors.text }]}>{item.nutritionalInfo.carbs}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: theme.colors.textSecondary }]}>Fat</Text>
              <Text style={[styles.macroValue, { color: theme.colors.text }]}>{item.nutritionalInfo.fat}g</Text>
            </View>
          </View>
        )}

        {/* Ingredients Section */}
        {item.ingredients && item.ingredients.length > 0 && (
          <View style={styles.ingredientsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {item.ingredients.slice(0, 5).map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Feather name="check" size={14} color={theme.colors.primary} style={styles.ingredientIcon} />
                  <Text style={[styles.ingredientText, { color: theme.colors.text }]}>
                    {typeof ingredient === "string" ? ingredient : ingredient.name || "Unknown"}
                  </Text>
                </View>
              ))}
              {item.ingredients.length > 5 && (
                <Text style={[styles.moreIngredients, { color: theme.colors.primary }]}>
                  +{item.ingredients.length - 5} more ingredients
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Health Benefits Section */}
        {item.healthBenefits && item.healthBenefits.length > 0 && (
          <View style={styles.benefitsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Health Benefits</Text>
            <View style={styles.benefitsList}>
              {item.healthBenefits.slice(0, 3).map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Feather name="heart" size={14} color={theme.colors.success} style={styles.benefitIcon} />
                  <Text style={[styles.benefitText, { color: theme.colors.text }]}>{benefit}</Text>
                </View>
              ))}
              {item.healthBenefits.length > 3 && (
                <Text style={[styles.moreBenefits, { color: theme.colors.primary }]}>
                  +{item.healthBenefits.length - 3} more benefits
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Dietary Classifications */}
        {item.dietaryClassifications && item.dietaryClassifications.length > 0 && (
          <View style={styles.dietarySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.dietaryClassifications.map((classification, index) => (
                <View key={index} style={[styles.dietaryTag, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.dietaryText, { color: theme.colors.primary }]}>{classification}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {item.nutritionalWarning && (
          <View style={[styles.warningBox, { backgroundColor: theme.colors.warningLight }]}>
            <Feather name="alert-triangle" size={16} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>{item.nutritionalWarning}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  )

  const calculateTotalMacro = (entries, macroType) => {
    return entries.reduce((total, entry) => {
      if (entry.nutritionalInfo && entry.nutritionalInfo[macroType]) {
        return total + Number(entry.nutritionalInfo[macroType])
      }
      return total
    }, 0)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{formattedDate}</Text>
        <TouchableOpacity onPress={handleShareFoodLog} style={styles.shareButton}>
          <Feather name="share-2" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Nutrition Summary</Text>
              <View style={[styles.calorieBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.calorieText, { color: theme.colors.primary }]}>{totalCalories} calories</Text>
              </View>
            </View>

            {foodEntries.length > 0 ? (
              <View style={styles.nutritionDetails}>
                <View style={styles.chartContainer}>
                  {nutritionData ? (
                    <PieChart
                      data={nutritionData}
                      width={screenWidth - 64}
                      height={180}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        labelColor: (opacity = 1) => theme.colors.text,
                      }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="0"
                      absolute
                    />
                  ) : (
                    <View style={styles.noChartContainer}>
                      <Text style={[styles.noChartText, { color: theme.colors.textSecondary }]}>
                        Add food entries to see nutrition breakdown
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.macroSummary}>
                  <View style={styles.macroSummaryItem}>
                    <View style={[styles.macroIndicator, { backgroundColor: "#4E7AC7" }]} />
                    <View style={styles.macroSummaryContent}>
                      <Text style={[styles.macroSummaryLabel, { color: theme.colors.textSecondary }]}>Protein</Text>
                      <Text style={[styles.macroSummaryValue, { color: theme.colors.text }]}>
                        {calculateTotalMacro(foodEntries, "protein")}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.macroSummaryItem}>
                    <View style={[styles.macroIndicator, { backgroundColor: "#6C63FF" }]} />
                    <View style={styles.macroSummaryContent}>
                      <Text style={[styles.macroSummaryLabel, { color: theme.colors.textSecondary }]}>Carbs</Text>
                      <Text style={[styles.macroSummaryValue, { color: theme.colors.text }]}>
                        {calculateTotalMacro(foodEntries, "carbs")}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.macroSummaryItem}>
                    <View style={[styles.macroIndicator, { backgroundColor: "#FF6384" }]} />
                    <View style={styles.macroSummaryContent}>
                      <Text style={[styles.macroSummaryLabel, { color: theme.colors.textSecondary }]}>Fat</Text>
                      <Text style={[styles.macroSummaryValue, { color: theme.colors.text }]}>
                        {calculateTotalMacro(foodEntries, "fat")}g
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noChartContainer}>
                <Text style={[styles.noChartText, { color: theme.colors.textSecondary }]}>
                  Add food entries to see nutrition breakdown
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Food Entries</Text>
            <Text style={[styles.entryCount, { color: theme.colors.textSecondary }]}>
              {foodEntries.length} {foodEntries.length === 1 ? "entry" : "entries"}
            </Text>
          </View>

          {foodEntries.length > 0 ? (
            <FlatList
              data={foodEntries}
              renderItem={renderFoodEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={60} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No Food Entries</Text>
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                You haven't added any meals for this day
              </Text>
            </View>
          )}
        </>
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push("/food")}
      >
        <Feather name="plus" size={24} color={theme.colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
  },
  calorieBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  calorieText: {
    fontFamily: "Inter-Bold",
    fontSize: 14,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  noChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 180,
  },
  noChartText: {
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  entryCount: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  foodItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  foodTitleContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  foodTime: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  foodImage: {
    width: "100%",
    height: 200,
  },
  nutritionInfo: {
    padding: 16,
  },
  calorieContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calorieLabel: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  calorieValue: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  macronutrients: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  macroItem: {
    alignItems: "center",
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  ingredientsSection: {
    marginTop: 8,
  },
  ingredientsList: {
    marginLeft: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ingredientIcon: {
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  moreIngredients: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginTop: 4,
    marginLeft: 22,
  },
  benefitsSection: {
    marginTop: 8,
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  benefitIcon: {
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  moreBenefits: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginTop: 4,
    marginLeft: 22,
  },
  dietarySection: {
    marginTop: 16,
    marginBottom: 8,
  },
  dietaryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  dietaryText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  nutritionDetails: {
    marginTop: 16,
  },
  macroSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  macroSummaryItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  macroIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  macroSummaryContent: {
    flex: 1,
  },
  macroSummaryLabel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  macroSummaryValue: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
  },
})
