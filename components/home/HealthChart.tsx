"use client"

import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { Feather } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { useRouter } from "expo-router"
import Animated, { FadeIn } from "react-native-reanimated"
import { Platform } from "react-native"
import * as Haptics from "expo-haptics"

interface HealthChartProps {
  healthData: any
}

export const HealthChart = ({ healthData }: HealthChartProps) => {
  const { theme } = useTheme()
  const router = useRouter()

  const handleInfoPress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    router.push("/graph-info")
  }

  // Default data if none provided
  const defaultData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [65, 70, 68, 72, 75, 71, 73],
        color: () => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
    legend: ["Health Score"],
  }

  const chartConfig = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: () => theme.colors.primary,
    labelColor: () => theme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.primary,
    },
    propsForBackgroundLines: {
      stroke: theme.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    },
  }

  return (
    <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Health Trends</Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>Last 7 days</Text>
          </View>
          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: theme.colors.primaryLight }]}
            onPress={handleInfoPress}
            activeOpacity={0.7}
          >
            <Feather name="info" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          <LineChart
            data={healthData || defaultData}
            width={Platform.OS === "ios" ? 340 : 320}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withDots={true}
            withShadow={false}
            segments={5}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>72</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Health Score</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>+5%</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Weekly Change</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>Good</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Overall Status</Text>
          </View>
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
  cardTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
  },
  cardSubtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    marginTop: 2,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: "80%",
    alignSelf: "center",
  },
})
