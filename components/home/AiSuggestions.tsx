"use client"

import { StyleSheet, View, Text } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"

interface AiSuggestionsProps {
  suggestions: string
}

export const AiSuggestions = ({ suggestions }: AiSuggestionsProps) => {
  const { theme } = useTheme()

  return (
    <Animated.View entering={FadeIn.delay(400).duration(800)} style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <View style={[styles.aiIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Feather name="cpu" size={16} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Health Insights</Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                AI-powered recommendations
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.suggestionContent}>
          <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
            {suggestions ||
              "Based on your health data, we recommend maintaining a balanced diet and regular exercise. Add more data for personalized insights."}
          </Text>
        </View>

        <View style={[styles.tipContainer, { backgroundColor: theme.colors.primaryLight }]}>
          <Feather name="zap" size={16} color={theme.colors.primary} style={styles.tipIcon} />
          <Text style={[styles.tipText, { color: theme.colors.primary }]}>
            Try adding more meals to get better nutrition recommendations.
          </Text>
        </View>
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  suggestionContent: {
    paddingVertical: 8,
  },
  suggestionText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    flex: 1,
  },
})
