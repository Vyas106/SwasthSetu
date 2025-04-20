"use client"

import { StyleSheet, View, Text, Image } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { useAuth } from "@/context/AuthContext"
import Animated from "react-native-reanimated"

type GreetingSectionProps = {
  greetingTranslateY: Animated.SharedValue<number>
  greetingScale: Animated.SharedValue<number>
}

export const GreetingSection = ({ greetingTranslateY, greetingScale }: GreetingSectionProps) => {
  const { theme } = useTheme()
  const { translateUI } = useLanguage()
  const { user } = useAuth()

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return translateUI("Good Morning")
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          // transform: [{ translateY: greetingTranslateY }, { scale: greetingScale }],
        },
      ]}
    >
      <View style={styles.greetingContainer}>
        <View style={styles.greetingTextContainer}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>{getGreeting()},</Text>
          <Text style={[styles.name, { color: theme.colors.text }]}>{user?.name || "User"}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {translateUI("Here's your health summary for today")}
          </Text>
        </View>
        <Image
          source={user?.profileImage ? { uri: user.profileImage } : require("@/assets/images/default-avatar.png")}
          style={styles.profileImage}
        />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  greetingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
  },
  name: {
    fontSize: 32,
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
})
