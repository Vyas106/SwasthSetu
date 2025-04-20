"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Switch,
  Share,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { getMedicalReportById, deleteMedicalReport } from "@/services/firebase"
import { getMedicalReportRecommendations } from "@/services/gemini"
import type { MedicalReport } from "@/types"

export default function MedicalReportDetailScreen() {
  const { theme, getFontSize } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useLocalSearchParams()

  const [report, setReport] = useState<MedicalReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [isVegetarian, setIsVegetarian] = useState(true)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    const loadReport = async () => {
      if (user && id) {
        try {
          setLoading(true)
          const reportData = await getMedicalReportById(user.id, id as string)
          setReport(reportData)

          // Load initial recommendations
          loadRecommendations(reportData, isVegetarian)
        } catch (error) {
          console.error("Error loading medical report:", error)
          Alert.alert("Error", "Failed to load medical report. Please try again.")
          router.back()
        } finally {
          setLoading(false)
        }
      }
    }

    loadReport()
  }, [user, id, router])

  const loadRecommendations = async (reportData, vegetarian) => {
    try {
      setRecommendationsLoading(true)
      const data = await getMedicalReportRecommendations(reportData, vegetarian)
      setRecommendations(data)
    } catch (error) {
      console.error("Error loading recommendations:", error)
      Alert.alert("Error", "Failed to load recommendations. Please try again.")
    } finally {
      setRecommendationsLoading(false)
    }
  }

  const handleDietPreferenceChange = (value) => {
    setIsVegetarian(value)
    if (report) {
      loadRecommendations(report, value)
    }
  }

  const handleDeleteReport = async () => {
    if (!user || !report) return

    Alert.alert("Delete Report", "Are you sure you want to delete this report? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMedicalReport(user.id, report.id)
            Alert.alert("Success", "Report deleted successfully")
            router.back()
          } catch (error) {
            console.error("Error deleting report:", error)
            Alert.alert("Error", "Failed to delete report. Please try again.")
          }
        },
      },
    ])
  }

  const handleShareReport = async () => {
    if (!report) return

    try {
      const message = `
Medical Report Summary

Title: ${report.title}
Date: ${report.date}
Doctor: ${report.doctor}
Hospital: ${report.hospital}

Summary:
${report.summary}

Health Metrics:
${Object.entries(report.metrics || {})
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}
      `.trim()

      await Share.share({
        message,
        title: `Medical Report - ${report.title}`,
      })
    } catch (error) {
      console.error("Error sharing report:", error)
      Alert.alert("Error", "Failed to share report. Please try again.")
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Medical Report</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      </SafeAreaView>
    )
  }

  if (!report) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Medical Report</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Report Not Found</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            The medical report you're looking for could not be found.
          </Text>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.errorButtonText, { color: theme.colors.white }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
          Medical Report
        </Text>
        <TouchableOpacity onPress={handleShareReport}>
          <Feather name="share-2" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "details" && [styles.activeTab, { borderBottomColor: theme.colors.primary }],
          ]}
          onPress={() => setActiveTab("details")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "details" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "recommendations" && [styles.activeTab, { borderBottomColor: theme.colors.primary }],
          ]}
          onPress={() => setActiveTab("recommendations")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "recommendations" ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Recommendations
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === "details" ? (
          <>
            <View style={[styles.reportHeader, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.reportTitle, { color: theme.colors.text, fontSize: getFontSize(24) }]}>
                {report.title}
              </Text>
              <Text style={[styles.reportDate, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
                {report.date}
              </Text>

              <View style={styles.divider} />

              <View style={styles.providerInfo}>
                <View style={styles.providerItem}>
                  <Text
                    style={[styles.providerLabel, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Doctor
                  </Text>
                  <Text style={[styles.providerValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    {report.doctor}
                  </Text>
                </View>
                <View style={styles.providerItem}>
                  <Text
                    style={[styles.providerLabel, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                  >
                    Hospital
                  </Text>
                  <Text style={[styles.providerValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    {report.hospital}
                  </Text>
                </View>
              </View>
            </View>

            {report.fileUrl && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: report.fileUrl }} style={styles.reportImage} resizeMode="contain" />
              </View>
            )}

            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                Summary
              </Text>
              <Text style={[styles.summaryText, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                {report.summary}
              </Text>
            </View>

            {report.metrics && Object.keys(report.metrics).length > 0 && (
              <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                  Health Metrics
                </Text>
                {Object.entries(report.metrics).map(([key, value], index) => (
                  <View
                    key={index}
                    style={[
                      styles.metricItem,
                      index < Object.keys(report.metrics).length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.metricLabel, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                    </Text>
                    <Text style={[styles.metricValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: theme.colors.danger }]}
              onPress={handleDeleteReport}
            >
              <Feather name="trash-2" size={20} color={theme.colors.white} style={styles.deleteIcon} />
              <Text style={[styles.deleteText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
                Delete Report
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.dietPreference, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.dietTitle, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                Diet Preference
              </Text>
              <View style={styles.dietOptions}>
                <Text
                  style={[
                    styles.dietOptionText,
                    { color: isVegetarian ? theme.colors.textSecondary : theme.colors.text },
                  ]}
                >
                  Non-Vegetarian
                </Text>
                <Switch
                  value={isVegetarian}
                  onValueChange={handleDietPreferenceChange}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                  thumbColor={isVegetarian ? theme.colors.primary : "#f4f3f4"}
                />
                <Text
                  style={[
                    styles.dietOptionText,
                    { color: isVegetarian ? theme.colors.text : theme.colors.textSecondary },
                  ]}
                >
                  Vegetarian
                </Text>
              </View>
            </View>

            {recommendationsLoading ? (
              <View style={styles.recommendationsLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Generating personalized recommendations...
                </Text>
              </View>
            ) : recommendations ? (
              <>
                <View style={[styles.recommendationSection, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.recommendationHeader}>
                    <Feather name="clipboard" size={20} color={theme.colors.primary} />
                    <Text style={[styles.recommendationTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                      Medications
                    </Text>
                  </View>
                  <View style={styles.recommendationList}>
                    {recommendations.medications.map((medication, index) => (
                      <View
                        key={index}
                        style={[styles.recommendationItem, { backgroundColor: theme.colors.primaryLight }]}
                      >
                        <Text
                          style={[
                            styles.recommendationItemText,
                            { color: theme.colors.primary, fontSize: getFontSize(16) },
                          ]}
                        >
                          {medication}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.disclaimer, { color: theme.colors.textSecondary }]}>
                    * Always consult with your doctor before taking any medication
                  </Text>
                </View>

                <View style={[styles.recommendationSection, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.recommendationHeader}>
                    <Feather name="coffee" size={20} color={theme.colors.primary} />
                    <Text style={[styles.recommendationTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                      Diet Recommendations
                    </Text>
                  </View>
                  <View style={styles.recommendationList}>
                    {recommendations.diet.map((diet, index) => (
                      <View
                        key={index}
                        style={[styles.recommendationItem, { backgroundColor: theme.colors.primaryLight }]}
                      >
                        <Text
                          style={[
                            styles.recommendationItemText,
                            { color: theme.colors.primary, fontSize: getFontSize(16) },
                          ]}
                        >
                          {diet}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={[styles.recommendationSection, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.recommendationHeader}>
                    <Feather name="activity" size={20} color={theme.colors.primary} />
                    <Text style={[styles.recommendationTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                      Activities
                    </Text>
                  </View>
                  <View style={styles.recommendationList}>
                    {recommendations.activities.map((activity, index) => (
                      <View
                        key={index}
                        style={[styles.recommendationItem, { backgroundColor: theme.colors.primaryLight }]}
                      >
                        <Text
                          style={[
                            styles.recommendationItemText,
                            { color: theme.colors.primary, fontSize: getFontSize(16) },
                          ]}
                        >
                          {activity}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={[styles.recommendationSection, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.recommendationHeader}>
                    <Feather name="alert-triangle" size={20} color={theme.colors.primary} />
                    <Text style={[styles.recommendationTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                      Precautions
                    </Text>
                  </View>
                  <View style={styles.recommendationList}>
                    {recommendations.precautions.map((precaution, index) => (
                      <View
                        key={index}
                        style={[styles.recommendationItem, { backgroundColor: theme.colors.primaryLight }]}
                      >
                        <Text
                          style={[
                            styles.recommendationItemText,
                            { color: theme.colors.primary, fontSize: getFontSize(16) },
                          ]}
                        >
                          {precaution}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.noRecommendations}>
                <Feather name="alert-circle" size={60} color={theme.colors.textSecondary} />
                <Text style={[styles.noRecommendationsTitle, { color: theme.colors.text }]}>
                  No Recommendations Available
                </Text>
                <Text style={[styles.noRecommendationsText, { color: theme.colors.textSecondary }]}>
                  We couldn't generate recommendations for this report. Please try again later.
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => loadRecommendations(report, isVegetarian)}
                >
                  <Text style={[styles.retryButtonText, { color: theme.colors.white }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  reportHeader: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  reportDate: {
    fontFamily: "Inter-Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginVertical: 16,
  },
  providerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  providerItem: {
    flex: 1,
  },
  providerLabel: {
    fontFamily: "Inter-Regular",
    marginBottom: 4,
  },
  providerValue: {
    fontFamily: "Inter-Bold",
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  reportImage: {
    width: "100%",
    height: 300,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 12,
  },
  summaryText: {
    fontFamily: "Inter-Regular",
    lineHeight: 24,
  },
  metricItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  metricLabel: {
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  metricValue: {
    fontFamily: "Inter-Bold",
    flex: 1,
    textAlign: "right",
  },
  deleteButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteText: {
    fontFamily: "Inter-Bold",
  },
  dietPreference: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dietTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 12,
  },
  dietOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dietOptionText: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    marginHorizontal: 12,
  },
  recommendationsLoading: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  recommendationSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  recommendationTitle: {
    fontFamily: "Inter-Bold",
    marginLeft: 8,
  },
  recommendationList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  recommendationItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  recommendationItemText: {
    fontFamily: "Inter-Medium",
  },
  disclaimer: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 12,
  },
  noRecommendations: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noRecommendationsTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  noRecommendationsText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    fontFamily: "Inter-Bold",
    fontSize: 16,
  },
})
