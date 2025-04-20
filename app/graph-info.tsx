"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, SafeAreaView } from "react-native"
import { useRouter } from "expo-router"
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import Animated, { FadeInDown } from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/context/ThemeContext"

const screenWidth = Dimensions.get("window").width

const GraphInfoPage = () => {
  const router = useRouter()
  const { theme, getFontSize } = useTheme()
  const [activeTab, setActiveTab] = useState("overview")

  const handleTabPress = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActiveTab(tab)
  }

  // Sample data for demonstration
  const lineChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [2100, 1950, 2300, 2000, 2400, 2200, 1800],
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [55, 49, 60, 52, 58, 62, 50],
        color: (opacity = 1) => `rgba(65, 105, 225, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [280, 250, 300, 270, 310, 290, 260],
        color: (opacity = 1) => `rgba(50, 205, 50, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Calories", "Protein", "Carbs"],
  }

  const barChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [70, 65, 80, 75, 85, 78, 72],
      },
    ],
  }

  const pieChartData = [
    {
      name: "Protein",
      population: 25,
      color: "rgba(65, 105, 225, 1)",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Carbs",
      population: 50,
      color: "rgba(50, 205, 50, 1)",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Fat",
      population: 20,
      color: "rgba(255, 165, 0, 1)",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Fiber",
      population: 5,
      color: "rgba(138, 43, 226, 1)",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.contentContainer}>
            <Text style={[styles.contentTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
              Health Graph Overview
            </Text>
            <Text style={[styles.contentText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
              Your health graph provides a visual representation of your nutritional intake over time. This helps you
              track your progress and identify patterns in your diet.
            </Text>

            <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.chartTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Weekly Nutrition Overview
              </Text>
              <LineChart
                data={lineChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => theme.colors.text,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: theme.colors.background,
                  },
                }}
                bezier
                style={styles.chart}
                legend={lineChartData.legend}
              />
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.colors.primaryLight }]}>
              <Feather name="info" size={24} color={theme.colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
                Tap on different nutrition types in the home screen to view specific data for calories, protein, carbs,
                fat, and fiber.
              </Text>
            </View>
          </Animated.View>
        )

      case "calories":
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.contentContainer}>
            <Text style={[styles.contentTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>Calories</Text>
            <Text style={[styles.contentText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
              Calories are a measure of energy in food. Your daily calorie needs depend on your age, gender, weight,
              height, and activity level.
            </Text>

            <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.chartTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Weekly Calorie Intake
              </Text>
              <BarChart
                data={barChartData}
                width={screenWidth - 40}
                height={220}
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
                  labelColor: (opacity = 1) => theme.colors.text,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.7,
                }}
                style={styles.chart}
              />
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.infoCardTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Daily Recommended Intake
              </Text>
              <Text style={[styles.infoCardText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
                The average recommended daily calorie intake is:
              </Text>
              <View style={styles.infoCardList}>
                <Text
                  style={[styles.infoCardListItem, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}
                >
                  • Women: 1,600–2,400 calories
                </Text>
                <Text
                  style={[styles.infoCardListItem, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}
                >
                  • Men: 2,000–3,000 calories
                </Text>
                <Text
                  style={[styles.infoCardListItem, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}
                >
                  • Children: 1,000–2,000 calories
                </Text>
                <Text
                  style={[styles.infoCardListItem, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}
                >
                  • Elderly: 1,600–2,200 calories
                </Text>
              </View>
              <Text style={[styles.infoCardText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
                These values vary based on age, weight, height, and activity level.
              </Text>
            </View>
          </Animated.View>
        )

      case "nutrients":
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.contentContainer}>
            <Text style={[styles.contentTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
              Nutrient Breakdown
            </Text>
            <Text style={[styles.contentText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
              A balanced diet includes the right proportion of macronutrients: protein, carbohydrates, and fats, along
              with essential micronutrients.
            </Text>

            <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.chartTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Macronutrient Distribution
              </Text>
              <PieChart
                data={pieChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.colors.text,
                  style: {
                    borderRadius: 16,
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={styles.chart}
              />
            </View>

            <View style={styles.nutrientGrid}>
              <View
                style={[
                  styles.nutrientCard,
                  { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border },
                ]}
              >
                <MaterialCommunityIcons name="food-steak" size={24} color={theme.colors.primary} />
                <Text style={[styles.nutrientTitle, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Protein
                </Text>
                <Text style={[styles.nutrientText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                  10-35% of daily calories
                </Text>
              </View>

              <View
                style={[
                  styles.nutrientCard,
                  { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border },
                ]}
              >
                <MaterialCommunityIcons name="bread-slice" size={24} color={theme.colors.primary} />
                <Text style={[styles.nutrientTitle, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Carbs
                </Text>
                <Text style={[styles.nutrientText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                  45-65% of daily calories
                </Text>
              </View>

              <View
                style={[
                  styles.nutrientCard,
                  { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border },
                ]}
              >
                <MaterialCommunityIcons name="oil" size={24} color={theme.colors.primary} />
                <Text style={[styles.nutrientTitle, { color: theme.colors.text, fontSize: getFontSize(16) }]}>Fat</Text>
                <Text style={[styles.nutrientText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                  20-35% of daily calories
                </Text>
              </View>

              <View
                style={[
                  styles.nutrientCard,
                  { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border },
                ]}
              >
                <MaterialCommunityIcons name="grain" size={24} color={theme.colors.primary} />
                <Text style={[styles.nutrientTitle, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Fiber
                </Text>
                <Text style={[styles.nutrientText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                  25-30g per day
                </Text>
              </View>
            </View>
          </Animated.View>
        )

      case "vitamins":
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.contentContainer}>
            <Text style={[styles.contentTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
              Vitamins & Minerals
            </Text>
            <Text style={[styles.contentText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
              Micronutrients are essential for various bodily functions. They include vitamins and minerals that your
              body needs in small amounts.
            </Text>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.infoCardTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Essential Vitamins
              </Text>
              <View style={styles.vitaminGrid}>
                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Vitamin A
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Carrots, Sweet Potatoes
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Vitamin C
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Citrus Fruits, Bell Peppers
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Vitamin D
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Sunlight, Fatty Fish
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Vitamin E
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Nuts, Seeds, Vegetable Oils
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Vitamin K
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Leafy Greens, Broccoli
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    B Vitamins
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Whole Grains, Meat, Eggs
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.infoCardTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Essential Minerals
              </Text>
              <View style={styles.vitaminGrid}>
                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Calcium
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Dairy Products, Leafy Greens
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Iron
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Red Meat, Beans, Spinach
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Magnesium
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Nuts, Seeds, Whole Grains
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Potassium
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Bananas, Potatoes, Avocados
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Zinc
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Meat, Shellfish, Legumes
                  </Text>
                </View>

                <View style={styles.vitaminItem}>
                  <Text style={[styles.vitaminName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    Selenium
                  </Text>
                  <Text
                    style={[styles.vitaminSource, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Brazil Nuts, Fish, Eggs
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )

      default:
        return null
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
          Health Graph Information
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "overview" && [styles.activeTab, { backgroundColor: theme.colors.primary }],
            ]}
            onPress={() => handleTabPress("overview")}
          >
            <Feather
              name="bar-chart-2"
              size={16}
              color={activeTab === "overview" ? theme.colors.white : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "overview" ? theme.colors.white : theme.colors.textSecondary,
                  fontSize: getFontSize(14),
                },
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "calories" && [styles.activeTab, { backgroundColor: theme.colors.primary }],
            ]}
            onPress={() => handleTabPress("calories")}
          >
            <Feather
              name="activity"
              size={16}
              color={activeTab === "calories" ? theme.colors.white : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "calories" ? theme.colors.white : theme.colors.textSecondary,
                  fontSize: getFontSize(14),
                },
              ]}
            >
              Calories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "nutrients" && [styles.activeTab, { backgroundColor: theme.colors.primary }],
            ]}
            onPress={() => handleTabPress("nutrients")}
          >
            <Feather
              name="pie-chart"
              size={16}
              color={activeTab === "nutrients" ? theme.colors.white : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "nutrients" ? theme.colors.white : theme.colors.textSecondary,
                  fontSize: getFontSize(14),
                },
              ]}
            >
              Nutrients
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "vitamins" && [styles.activeTab, { backgroundColor: theme.colors.primary }],
            ]}
            onPress={() => handleTabPress("vitamins")}
          >
            <Feather
              name="droplet"
              size={16}
              color={activeTab === "vitamins" ? theme.colors.white : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === "vitamins" ? theme.colors.white : theme.colors.textSecondary,
                  fontSize: getFontSize(14),
                },
              ]}
            >
              Vitamins
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>
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
  headerTitle: {
    fontFamily: "Inter-Bold",
  },
  tabBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  tabScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  activeTab: {
    backgroundColor: "#4E7AC7",
  },
  tabText: {
    fontFamily: "Inter-Medium",
    marginLeft: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentContainer: {
    padding: 16,
  },
  contentTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  contentText: {
    fontFamily: "Inter-Regular",
    lineHeight: 22,
    marginBottom: 20,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontFamily: "Inter-Medium",
    flex: 1,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 12,
  },
  infoCardText: {
    fontFamily: "Inter-Regular",
    marginBottom: 12,
    lineHeight: 22,
  },
  infoCardList: {
    marginBottom: 12,
  },
  infoCardListItem: {
    fontFamily: "Inter-Regular",
    marginBottom: 8,
    lineHeight: 22,
  },
  nutrientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  nutrientCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  nutrientTitle: {
    fontFamily: "Inter-Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  nutrientText: {
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  vitaminGrid: {
    marginTop: 8,
  },
  vitaminItem: {
    marginBottom: 16,
  },
  vitaminName: {
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  vitaminSource: {
    fontFamily: "Inter-Regular",
  },
})

export default GraphInfoPage
