"use client"

import React from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"

export default function TermsServiceScreen() {
  const { theme, getFontSize } = useTheme()
  const { translate, isTranslating } = useLanguage()
  const router = useRouter()
  const [translatedContent, setTranslatedContent] = React.useState({
    title: "Terms of Service",
    sections: [],
  })

  React.useEffect(() => {
    const translateContent = async () => {
      const sections = [
        {
          title: "1. Acceptance of Terms",
          content:
            "By accessing or using the Smart City Assistant mobile application, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this app.",
        },
        {
          title: "2. Use License",
          content:
            "Permission is granted to temporarily download one copy of the app for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose; attempt to decompile or reverse engineer any software contained in the app; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person or 'mirror' the materials on any other server.",
        },
        {
          title: "3. User Account",
          content:
            "To use certain features of the app, you may be required to register for an account. You must provide accurate and complete information and keep your account information updated. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your mobile device, and you agree to accept responsibility for all activities that occur under your account.",
        },
        {
          title: "4. Privacy Policy",
          content:
            "Your use of the app is also governed by our Privacy Policy, which is incorporated herein by reference. Please review our Privacy Policy to understand our practices regarding your personal information.",
        },
        {
          title: "5. Health Information",
          content:
            "The app may collect and store health-related information. This information is used solely to provide you with the services offered by the app. We do not share your health information with third parties except as required to provide the services or as required by law.",
        },
        {
          title: "6. Disclaimer",
          content:
            "The information provided by the app is for general informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
        },
        {
          title: "7. Limitation of Liability",
          content:
            "In no event shall Smart City Assistant, its officers, directors, employees, or agents, be liable to you for any direct, indirect, incidental, special, punitive, or consequential damages whatsoever resulting from any (i) errors, mistakes, or inaccuracies of content; (ii) personal injury or property damage, of any nature whatsoever, resulting from your access to and use of our app; (iii) any unauthorized access to or use of our secure servers and/or any and all personal information and/or financial information stored therein.",
        },
        {
          title: "8. Changes to Terms",
          content:
            "Smart City Assistant reserves the right, at its sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our app after those revisions become effective, you agree to be bound by the revised terms.",
        },
        {
          title: "9. Contact Us",
          content: "If you have any questions about these Terms, please contact us at support@smartcityassistant.com.",
        },
      ]

      const translatedTitle = await translate("Terms of Service")
      const translatedSections = await Promise.all(
        sections.map(async (section) => ({
          title: await translate(section.title),
          content: await translate(section.content),
        })),
      )

      setTranslatedContent({
        title: translatedTitle,
        sections: translatedSections,
      })
    }

    translateContent()
  }, [translate])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
          {translatedContent.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {isTranslating ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
            Translating content...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
              Last Updated: April 19, 2025
            </Text>

            {translatedContent.sections.map((section, index) => (
              <View key={index} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionContent, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  {section.content}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: "Inter-Bold",
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontFamily: "Inter-Regular",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  sectionContent: {
    fontFamily: "Inter-Regular",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Inter-Regular",
  },
})
