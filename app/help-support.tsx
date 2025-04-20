"use client"

import React, { useState } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useLanguage } from "@/context/LanguageContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as Linking from "expo-linking"
import * as Haptics from "expo-haptics"

export default function HelpSupportScreen() {
  const { theme, getFontSize } = useTheme()
  const { translate, isTranslating } = useLanguage()
  const router = useRouter()
  const [translatedContent, setTranslatedContent] = React.useState({
    title: "Help & Support",
    contactUs: "Contact Us",
    name: "Name",
    email: "Email",
    message: "Message",
    submit: "Submit",
    faqTitle: "Frequently Asked Questions",
    faqs: [],
  })
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  })

  React.useEffect(() => {
    const translateContent = async () => {
      const faqs = [
        {
          question: "How do I add a food entry?",
          answer:
            "To add a food entry, go to the Food Journal tab and tap the + button in the top right corner. You can then take a photo of your food or select an image from your gallery. Our AI will analyze the food and provide nutritional information.",
        },
        {
          question: "How do I set a reminder?",
          answer:
            "You can set a reminder by going to the Home screen and tapping on 'Set Reminder' in the quick actions, or by going to the Reminders page from your profile. Enter the reminder details, set the date and time, and tap 'Set Reminder'.",
        },
        {
          question: "How do I find nearby healthcare services?",
          answer:
            "To find nearby healthcare services, go to the Nearby tab. Make sure your address is set correctly in your profile. The app will show hospitals, pharmacies, and other healthcare facilities near your location.",
        },
        {
          question: "How do I add emergency contacts?",
          answer:
            "You can add emergency contacts by going to your Profile and scrolling down to the Emergency Contacts section. Tap the + button to add a new contact. Enter their name, relationship, and phone number.",
        },
        {
          question: "How do I change the app language?",
          answer:
            "To change the app language, go to your Profile, scroll down to Settings, and tap on Language. You can choose between English, Hindi, and Gujarati. The app will use AI to translate content into your selected language.",
        },
        {
          question: "Is my health data secure?",
          answer:
            "Yes, your health data is secure. We use encryption to protect your data and do not share it with third parties without your consent. You can read more about our data practices in our Privacy Policy.",
        },
        {
          question: "How do I delete my account?",
          answer:
            "To delete your account, please contact our support team at support@smartcityassistant.com. We will process your request and delete all your data from our servers.",
        },
      ]

      const translatedTitle = await translate("Help & Support")
      const translatedContactUs = await translate("Contact Us")
      const translatedName = await translate("Name")
      const translatedEmail = await translate("Email")
      const translatedMessage = await translate("Message")
      const translatedSubmit = await translate("Submit")
      const translatedFaqTitle = await translate("Frequently Asked Questions")

      const translatedFaqs = await Promise.all(
        faqs.map(async (faq) => ({
          question: await translate(faq.question),
          answer: await translate(faq.answer),
        })),
      )

      setTranslatedContent({
        title: translatedTitle,
        contactUs: translatedContactUs,
        name: translatedName,
        email: translatedEmail,
        message: translatedMessage,
        submit: translatedSubmit,
        faqTitle: translatedFaqTitle,
        faqs: translatedFaqs,
      })
    }

    translateContent()
  }, [translate])

  const toggleFaq = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const handleSubmit = () => {
    // Validate form
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactForm.email)) {
      Alert.alert("Error", "Please enter a valid email address")
      return
    }

    // Provide haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    // In a real app, you would send this data to your backend
    // For now, we'll just show a success message
    Alert.alert("Message Sent", "Thank you for contacting us. We will get back to you as soon as possible.", [
      {
        text: "OK",
        onPress: () => {
          setContactForm({
            name: "",
            email: "",
            message: "",
          })
        },
      },
    ])
  }

  const handleCallSupport = () => {
    Linking.openURL("tel:+1234567890")
  }

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@smartcityassistant.com")
  }

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
            {/* Support Options */}
            <View style={styles.supportOptions}>
              <TouchableOpacity
                style={[styles.supportOption, { backgroundColor: theme.colors.primaryLight }]}
                onPress={handleCallSupport}
              >
                <Feather name="phone" size={24} color={theme.colors.primary} style={styles.supportOptionIcon} />
                <Text style={[styles.supportOptionText, { color: theme.colors.primary, fontSize: getFontSize(16) }]}>
                  Call Support
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.supportOption, { backgroundColor: theme.colors.primaryLight }]}
                onPress={handleEmailSupport}
              >
                <Feather name="mail" size={24} color={theme.colors.primary} style={styles.supportOptionIcon} />
                <Text style={[styles.supportOptionText, { color: theme.colors.primary, fontSize: getFontSize(16) }]}>
                  Email Support
                </Text>
              </TouchableOpacity>
            </View>

            {/* FAQs */}
            <View style={[styles.faqContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                {translatedContent.faqTitle}
              </Text>

              {translatedContent.faqs.map((faq, index) => (
                <View
                  key={index}
                  style={[
                    styles.faqItem,
                    {
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index < translatedContent.faqs.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <TouchableOpacity style={styles.faqQuestion} onPress={() => toggleFaq(index)} activeOpacity={0.7}>
                    <Text style={[styles.faqQuestionText, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                      {faq.question}
                    </Text>
                    <Feather
                      name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {expandedFaq === index && (
                    <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                      {faq.answer}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Contact Form */}
            <View style={[styles.contactForm, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                {translatedContent.contactUs}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  {translatedContent.name}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
                  ]}
                  placeholder={translatedContent.name}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={contactForm.name}
                  onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  {translatedContent.email}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
                  ]}
                  placeholder={translatedContent.email}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={contactForm.email}
                  onChangeText={(text) => setContactForm({ ...contactForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  {translatedContent.message}
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    { color: theme.colors.text, borderColor: theme.colors.border, fontSize: getFontSize(16) },
                  ]}
                  placeholder={translatedContent.message}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={contactForm.message}
                  onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSubmit}
              >
                <Text style={[styles.submitButtonText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
                  {translatedContent.submit}
                </Text>
              </TouchableOpacity>
            </View>
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
  supportOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  supportOption: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  supportOptionIcon: {
    marginBottom: 8,
  },
  supportOptionText: {
    fontFamily: "Inter-Medium",
  },
  faqContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 16,
  },
  faqItem: {
    paddingVertical: 12,
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestionText: {
    fontFamily: "Inter-Medium",
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontFamily: "Inter-Regular",
    marginTop: 8,
    lineHeight: 22,
  },
  contactForm: {
    borderRadius: 16,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Inter-Medium",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: "Inter-Regular",
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontFamily: "Inter-Regular",
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonText: {
    fontFamily: "Inter-Bold",
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
