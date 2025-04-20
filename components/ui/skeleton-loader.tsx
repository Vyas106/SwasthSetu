"use client"

import { StyleSheet, View } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay } from "react-native-reanimated"
import { useEffect } from "react"

interface SkeletonLoaderProps {
  type: "chart" | "list" | "text" | "places"
  width?: number | string
  height?: number
  borderRadius?: number
}

export const SkeletonLoader = ({ type, width = "100%", height = 200, borderRadius = 20 }: SkeletonLoaderProps) => {
  const { theme } = useTheme()
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withDelay(
        100,
        withTiming(0.6, {
          duration: 1000,
        }),
      ),
      -1,
      true,
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    }
  })

  const renderContent = () => {
    switch (type) {
      case "chart":
        return (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius }]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Animated.View
                  style={[styles.titleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
                <Animated.View
                  style={[styles.subtitleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
              </View>
              <Animated.View style={[styles.circleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]} />
            </View>
            <Animated.View style={[styles.chartSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]} />
            <View style={styles.statsContainer}>
              <Animated.View style={[styles.statSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]} />
              <Animated.View style={[styles.statSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]} />
              <Animated.View style={[styles.statSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]} />
            </View>
          </View>
        )
      case "list":
        return (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius }]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Animated.View
                  style={[styles.titleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
                <Animated.View
                  style={[styles.subtitleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
              </View>
              <Animated.View style={[styles.circleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]} />
            </View>
            <View style={styles.listContainer}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <Animated.View
                      style={[styles.circleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                    />
                    <View style={styles.listItemContent}>
                      <Animated.View
                        style={[styles.listItemTitle, { backgroundColor: theme.colors.border }, animatedStyle]}
                      />
                      <Animated.View
                        style={[styles.listItemSubtitle, { backgroundColor: theme.colors.border }, animatedStyle]}
                      />
                    </View>
                  </View>
                  <Animated.View
                    style={[styles.listItemRight, { backgroundColor: theme.colors.border }, animatedStyle]}
                  />
                </View>
              ))}
            </View>
          </View>
        )
      case "text":
        return (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius }]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Animated.View
                  style={[styles.titleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
                <Animated.View
                  style={[styles.subtitleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
              </View>
              <Animated.View style={[styles.circleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]} />
            </View>
            <View style={styles.textContainer}>
              <Animated.View style={[styles.textLine, { backgroundColor: theme.colors.border }, animatedStyle]} />
              <Animated.View style={[styles.textLine, { backgroundColor: theme.colors.border }, animatedStyle]} />
              <Animated.View
                style={[styles.textLine, { backgroundColor: theme.colors.border, width: "70%" }, animatedStyle]}
              />
            </View>
          </View>
        )
      case "places":
        return (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius }]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Animated.View
                  style={[styles.titleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
                <Animated.View
                  style={[styles.subtitleSkeleton, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
              </View>
            </View>
            <View style={styles.placesContainer}>
              {[1, 2, 3].map((item) => (
                <Animated.View
                  key={item}
                  style={[styles.placeItem, { backgroundColor: theme.colors.border }, animatedStyle]}
                />
              ))}
            </View>
          </View>
        )
      default:
        return (
          <Animated.View
            style={[{ width, height, borderRadius, backgroundColor: theme.colors.border }, animatedStyle]}
          />
        )
    }
  }

  return <View style={styles.container}>{renderContent()}</View>
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
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
  headerLeft: {
    flex: 1,
  },
  titleSkeleton: {
    height: 20,
    width: "60%",
    borderRadius: 4,
    marginBottom: 8,
  },
  subtitleSkeleton: {
    height: 14,
    width: "40%",
    borderRadius: 4,
  },
  circleSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  chartSkeleton: {
    height: 180,
    borderRadius: 8,
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  statSkeleton: {
    height: 40,
    width: "30%",
    borderRadius: 8,
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  listItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  listItemTitle: {
    height: 16,
    width: "80%",
    borderRadius: 4,
    marginBottom: 8,
  },
  listItemSubtitle: {
    height: 12,
    width: "60%",
    borderRadius: 4,
  },
  listItemRight: {
    height: 24,
    width: 60,
    borderRadius: 12,
  },
  textContainer: {
    marginTop: 8,
  },
  textLine: {
    height: 14,
    width: "100%",
    borderRadius: 4,
    marginBottom: 12,
  },
  placesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  placeItem: {
    height: 120,
    width: "30%",
    borderRadius: 12,
  },
})
