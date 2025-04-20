"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { fetchFoodDays } from "@/services/firebase"

type HealthChartProps = {
  healthData: any
}

export const HealthChart: React.FC<HealthChartProps> = ({ healthData }) => {
  const { theme } = useTheme()
  const { translateUI } = useLanguage()
  const { user } = useAuth()
  const [activeMetric, setActiveMetric] = useState("bloodPressure")
  const screenWidth = Dimensions.get("window").width - 32 // Adjust for padding
  const [foodData, setFoodData] = useState(null)
  const [nutritionData, setNutritionData] = useState({
    calories: [],
    protein: [],
    carbs: [],
    fat: [],
  })

  // Fetch food data for nutrition tracking
  useEffect(() => {
    const loadFoodData = async () => {
      if (user) {
        try {
          const data = await fetchFoodDays(user.id)
          setFoodData(data)

          // Process nutrition data from food entries
          processNutritionData(data)
        } catch (error) {
          console.error("Error loading food data for health chart:", error)
        }
      }
    }

    loadFoodData()
  }, [user])

  // Process nutrition data from food entries
  const processNutritionData = (foodDays) => {
    if (!foodDays || foodDays.length === 0) return

    // Initialize arrays for each metric
    const calories = []
    const protein = []
    const carbs = []
    const fat = []

    // Get the last 7 days of data (or less if not available)
    const last7Days = foodDays.slice(0, 7)

    // Process each day
    last7Days.forEach((day) => {
      // Add total calories for the day
      calories.push({
        date: day.date.toISOString().split("T")[0],
        value: day.totalCalories,
      })

      // Calculate total nutrients for the day
      let totalProtein = 0
      let totalCarbs = 0
      let totalFat = 0

      day.items.forEach((item) => {
        // Extract nutritional info if available
        if (item.nutritionalInfo) {
          totalProtein += Number.parseFloat(item.nutritionalInfo.protein) || 0
          totalCarbs += Number.parseFloat(item.nutritionalInfo.carbs) || 0
          totalFat += Number.parseFloat(item.nutritionalInfo.fat) || 0
        }
      })

      // Add nutrient totals for the day
      protein.push({
        date: day.date.toISOString().split("T")[0],
        value: totalProtein,
      })

      carbs.push({
        date: day.date.toISOString().split("T")[0],
        value: totalCarbs,
      })

      fat.push({
        date: day.date.toISOString().split("T")[0],
        value: totalFat,
      })
    })

    // Sort data by date (oldest to newest)
    const sortByDate = (a, b) => new Date(a.date) - new Date(b.date)

    setNutritionData({
      calories: calories.sort(sortByDate),
      protein: protein.sort(sortByDate),
      carbs: carbs.sort(sortByDate),
      fat: fat.sort(sortByDate),
    })
  }

  const getChartData = () => {
    if (!healthData) return null

    const labels = healthData[activeMetric].map((item: any) => {
      const date = new Date(item.date)
      return `${date.getDate()}/${date.getMonth() + 1}`
    })

    switch (activeMetric) {
      case "bloodPressure":
        return {
          labels,
          datasets: [
            {
              data: healthData.bloodPressure.map((item: any) => item.systolic),
              color: () => theme.colors.error,
              strokeWidth: 2,
            },
            {
              data: healthData.bloodPressure.map((item: any) => item.diastolic),
              color: () => theme.colors.info,
              strokeWidth: 2,
            },
          ],
          legend: ["Systolic", "Diastolic"],
        }
      case "bloodSugar":
        return {
          labels,
          datasets: [
            {
              data: healthData.bloodSugar.map((item: any) => item.value),
              color: () => theme.colors.accent,
              strokeWidth: 2,
            },
          ],
          legend: ["Blood Sugar"],
        }
      case "heartRate":
        return {
          labels,
          datasets: [
            {
              data: healthData.heartRate.map((item: any) => item.value),
              color: () => theme.colors.error,
              strokeWidth: 2,
            },
          ],
          legend: ["Heart Rate"],
        }
      case "weight":
        return {
          labels,
          datasets: [
            {
              data: healthData.weight.map((item: any) => item.value),
              color: () => theme.colors.primary,
              strokeWidth: 2,
            },
          ],
          legend: ["Weight"],
        }
      case "nutrition":
        // Use nutrition data from food entries if available
        if (nutritionData.calories.length > 0) {
          const nutritionLabels = nutritionData.calories.map((item) => {
            const date = new Date(item.date)
            return `${date.getDate()}/${date.getMonth() + 1}`
          })

          return {
            labels: nutritionLabels,
            datasets: [
              {
                data: nutritionData.calories.map((item) => item.value),
                color: () => theme.colors.primary,
                strokeWidth: 2,
              },
            ],
            legend: ["Calories"],
          }
        }
        return null
      case "nutrients":
        // Show protein, carbs, fat from food entries
        if (nutritionData.protein.length > 0) {
          const nutrientLabels = nutritionData.protein.map((item) => {
            const date = new Date(item.date)
            return `${date.getDate()}/${date.getMonth() + 1}`
          })

          return {
            labels: nutrientLabels,
            datasets: [
              {
                data: nutritionData.protein.map((item) => item.value),
                color: () => theme.colors.info,
                strokeWidth: 2,
              },
              {
                data: nutritionData.carbs.map((item) => item.value),
                color: () => theme.colors.primary,
                strokeWidth: 2,
              },
              {
                data: nutritionData.fat.map((item) => item.value),
                color: () => theme.colors.error,
                strokeWidth: 2,
              },
            ],
            legend: ["Protein", "Carbs", "Fat"],
          }
        }
        return null
      default:
        return null
    }
  }

  const chartData = getChartData()

  if (!healthData || !chartData) {
    return null
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{translateUI("Health Trends")}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{translateUI("Last 7 days")}</Text>
      </View>

      <View style={styles.metricsSelector}>
        <MetricButton
          label="BP"
          isActive={activeMetric === "bloodPressure"}
          onPress={() => setActiveMetric("bloodPressure")}
          theme={theme}
        />
        <MetricButton
          label="Sugar"
          isActive={activeMetric === "bloodSugar"}
          onPress={() => setActiveMetric("bloodSugar")}
          theme={theme}
        />
        <MetricButton
          label="Heart"
          isActive={activeMetric === "heartRate"}
          onPress={() => setActiveMetric("heartRate")}
          theme={theme}
        />
        <MetricButton
          label="Weight"
          isActive={activeMetric === "weight"}
          onPress={() => setActiveMetric("weight")}
          theme={theme}
        />
        <MetricButton
          label="Cals"
          isActive={activeMetric === "nutrition"}
          onPress={() => setActiveMetric("nutrition")}
          theme={theme}
        />
        <MetricButton
          label="Macros"
          isActive={activeMetric === "nutrients"}
          onPress={() => setActiveMetric("nutrients")}
          theme={theme}
        />
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 32} // Adjust for container padding
          height={180}
          chartConfig={{
            backgroundColor: theme.colors.card,
            backgroundGradientFrom: theme.colors.card,
            backgroundGradientTo: theme.colors.card,
            decimalPlaces: activeMetric === "weight" ? 1 : 0,
            color: (opacity = 1) => theme.colors.text + opacity.toString(16).padStart(2, "0"),
            labelColor: () => theme.colors.textSecondary,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={true}
          withShadow={false}
          withDots={true}
          withScrollableDot={false}
          yAxisInterval={1}
          fromZero={false}
          segments={5}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{translateUI("Health Score")}</Text>
          <View style={styles.statValueContainer}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{healthData.score}</Text>
            <View
              style={[
                styles.changeIndicator,
                {
                  backgroundColor:
                    healthData.weeklyChange > 0
                      ? theme.colors.success + "20"
                      : healthData.weeklyChange < 0
                        ? theme.colors.error + "20"
                        : theme.colors.gray[300] + "20",
                },
              ]}
            >
              <Feather
                name={healthData.weeklyChange > 0 ? "arrow-up" : "arrow-down"}
                size={12}
                color={healthData.weeklyChange > 0 ? theme.colors.success : theme.colors.error}
              />
              <Text
                style={[
                  styles.changeText,
                  {
                    color:
                      healthData.weeklyChange > 0
                        ? theme.colors.success
                        : healthData.weeklyChange < 0
                          ? theme.colors.error
                          : theme.colors.gray[500],
                  },
                ]}
              >
                {Math.abs(healthData.weeklyChange)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{translateUI("Overall Status")}</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  healthData.status === "Good"
                    ? theme.colors.success
                    : healthData.status === "Fair"
                      ? theme.colors.warning
                      : theme.colors.error,
              },
            ]}
          >
            {healthData.status}
          </Text>
        </View>
      </View>
    </View>
  )
}

type MetricButtonProps = {
  label: string
  isActive: boolean
  onPress: () => void
  theme: any
}

const MetricButton: React.FC<MetricButtonProps> = ({ label, isActive, onPress, theme }) => {
  return (
    <TouchableOpacity
      style={[
        styles.metricButton,
        {
          backgroundColor: isActive ? theme.colors.primary : theme.colors.background,
          borderColor: isActive ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.metricButtonText,
          {
            color: isActive ? theme.colors.white : theme.colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  metricsSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  metricButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  metricButtonText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  changeText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginLeft: 2,
  },
})
