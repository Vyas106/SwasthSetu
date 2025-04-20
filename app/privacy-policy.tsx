"use client"

import React from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"

export default function PrivacyPolicyScreen() {
  const { theme, getFontSize } = useTheme()
  const { translate, isTranslating } = useLanguage()
  const router = useRouter()
  const [translatedContent, setTranslatedContent] = React.useState({
    title: "Privacy Policy",
    sections: [],
  })

  React.useEffect(() => {
    const translateContent = async () => {
      const sections = [
        {
          title: "1. Information We Collect",
          content:
            "We collect information you provide directly to us, such as when you create an account, update your profile, use the interactive features of our app, participate in any interactive areas of our app, request customer support, or otherwise communicate with us. This information may include your name, email address, phone number, postal address, profile picture, health information, and any other information you choose to provide.",
        },
        {
          title: "2. How We Use Your Information",
          content:
            "We use the information we collect to provide, maintain, and improve our services, such as to administer your account, deliver the health services you request, and customize your experience. We may also use the information we collect to: send you technical notices, updates, security alerts, and support and administrative messages; respond to your comments, questions, and requests; communicate with you about products, services, offers, promotions, and events, and provide news and information we think will be of interest to you; monitor and analyze trends, usage, and activities in connection with our services; detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of Smart City Assistant and others; and carry out any other purpose described to you at the time the information was collected.",
        },
        {
          title: "3. Sharing of Information",
          content:
            "We may share information about you as follows or as otherwise described in this Privacy Policy: with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf; in response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law, regulation, or legal process; if we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of Smart City Assistant or others; in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company; between and among Smart City Assistant and our current and future parents, affiliates, subsidiaries, and other companies under common control and ownership; and with your consent or at your direction.",
        },
        {
          title: "4. Health Information",
          content:
            "We understand the sensitive nature of health information. We implement appropriate security measures to protect your health information and only use it to provide the services you request. We do not sell your health information to third parties. We may share anonymized, aggregated health data for research and improvement of our services.",
        },
        {
          title: "5. Data Security",
          content:
            "We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.",
        },
        {
          title: "6. Your Choices",
          content:
            "Account Information: You may update, correct, or delete your account information at any time by logging into your account or emailing us. Note that we may retain certain information as required by law or for legitimate business purposes. We may also retain cached or archived copies of information about you for a certain period of time. Location Information: You can prevent your device from sharing location information at any time through your device's operating system settings. Cookies: Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove or reject browser cookies. Please note that if you choose to remove or reject cookies, this could affect the availability and functionality of our services. Push Notifications: With your consent, we may send push notifications to your mobile device. You can deactivate these messages at any time by changing the notification settings on your mobile device.",
        },
        {
          title: "7. Changes to this Policy",
          content:
            "We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our website or providing you with an in-app notification).",
        },
        {
          title: "8. Contact Us",
          content:
            "If you have any questions about this Privacy Policy, please contact us at privacy@smartcityassistant.com.",
        },
      ]

      const translatedTitle = await translate("Privacy Policy")
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
