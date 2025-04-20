"use client"

import { useState, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Image,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import * as DocumentPicker from "expo-document-picker"
import * as ImagePicker from "expo-image-picker"
import { saveMedicalReport, fetchMedicalReports, deleteMedicalReport } from "@/services/firebase"
import type { MedicalReport } from "@/types"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import { useFocusEffect } from "expo-router"

export default function MedicalScreen() {
  const { theme, getFontSize } = useTheme()
  const { user } = useAuth()

  const [reports, setReports] = useState<MedicalReport[]>([])
  const [loading, setLoading] = useState(true)
  const [processingReport, setProcessingReport] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMedicalReports = useCallback(async () => {
    if (user) {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchMedicalReports(user.id)
        setReports(data)
      } catch (error) {
        console.error("Error loading medical reports:", error)
        setError("Failed to load medical reports. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }, [user])

  // Load reports when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMedicalReports()
    }, [loadMedicalReports]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadMedicalReports()
    setRefreshing(false)
  }, [loadMedicalReports])

  const handleAddReport = () => {
    setUploadModalVisible(true)
  }

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        return
      }

      await processReport(result.assets[0].uri)
    } catch (error) {
      console.error("Error picking document:", error)
      Alert.alert("Error", "Failed to pick document. Please try again.")
    } finally {
      setUploadModalVisible(false)
    }
  }

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is needed to take a photo.")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaType: "photo",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (result.canceled) {
        return
      }

      await processReport(result.assets[0].uri)
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Error", "Failed to take photo. Please try again.")
    } finally {
      setUploadModalVisible(false)
    }
  }

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Media library permission is needed to pick an image.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaType: "photo",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (result.canceled) {
        return
      }

      await processReport(result.assets[0].uri)
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    } finally {
      setUploadModalVisible(false)
    }
  }

  const processReport = async (fileUri) => {
    try {
      setProcessingReport(true)
      setPreviewImage(fileUri)
      setError(null)

      // For demo purposes, we'll use the medical certificate from the image
      // This simulates the Cloudinary upload and Gemini analysis
      const reportAnalysis = {
        title: "Medical Certificate",
        date: "2025-02-01",
        doctor: "Dr. Avinash Gupta",
        hospital: "Dum Dum Municipality Hospital",
        summary: "Patient Jyoti Shah is suffering from Muscular fever and requires 2 days of rest.",
        metrics: {
          condition: "Fever",
          restPeriod: "2 Days",
          effectiveFrom: "Muscular fever",
        },
        fileUrl: fileUri,
      }

      // Save report to Firebase
      if (user) {
        const savedReport = await saveMedicalReport(user.id, reportAnalysis)

        // Update local state
        setReports([savedReport, ...reports])

        Alert.alert("Success", "Medical report processed and saved successfully.")
      }
    } catch (error) {
      console.error("Error processing medical report:", error)
      setError("Failed to process medical report. Please try again.")
      Alert.alert("Error", "Failed to process medical report. Please try again.")
    } finally {
      setProcessingReport(false)
      setPreviewImage(null)
    }
  }

  const handleViewReport = (report: MedicalReport) => {
    setSelectedReport(report)
    setModalVisible(true)
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      if (!user) return

      Alert.alert("Delete Report", "Are you sure you want to delete this report?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMedicalReport(user.id, reportId)
            setReports(reports.filter((report) => report.id !== reportId))
            if (modalVisible && selectedReport?.id === reportId) {
              setModalVisible(false)
            }
          },
        },
      ])
    } catch (error) {
      console.error("Error deleting report:", error)
      Alert.alert("Error", "Failed to delete report. Please try again.")
    }
  }

  const handleExportReport = async () => {
    if (!selectedReport) return

    setExportLoading(true)
    try {
      // Generate PDF summary
      const pdfContent = `
        Medical Report Summary
        
        Title: ${selectedReport.title}
        Date: ${selectedReport.date}
        Doctor: ${selectedReport.doctor}
        Hospital: ${selectedReport.hospital}
        
        Summary:
        ${selectedReport.summary}
        
        Health Metrics:
        ${Object.entries(selectedReport.metrics || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}
      `

      // Create a temporary file
      const fileUri = `${FileSystem.cacheDirectory}report-summary.txt`
      await FileSystem.writeAsStringAsync(fileUri, pdfContent)

      // Share the file
      await Sharing.shareAsync(fileUri)
    } catch (error) {
      console.error("Error exporting report:", error)
      Alert.alert("Error", "Failed to export report. Please try again.")
    } finally {
      setExportLoading(false)
    }
  }

  const renderReportItem = ({ item }: { item: MedicalReport }) => (
    <TouchableOpacity
      style={[styles.reportCard, { backgroundColor: theme.colors.card }]}
      onPress={() => handleViewReport(item)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleContainer}>
          <Feather name="file-text" size={20} color={theme.colors.primary} />
          <Text style={[styles.reportTitle, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
            {item.title}
          </Text>
        </View>
        <Text style={[styles.reportDate, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
          {item.date}
        </Text>
      </View>

      <View style={styles.reportDetails}>
        <View style={styles.reportDetail}>
          <Text style={[styles.reportDetailLabel, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
            Doctor:
          </Text>
          <Text style={[styles.reportDetailValue, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
            {item.doctor}
          </Text>
        </View>

        <View style={styles.reportDetail}>
          <Text style={[styles.reportDetailLabel, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
            Hospital:
          </Text>
          <Text style={[styles.reportDetailValue, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
            {item.hospital}
          </Text>
        </View>
      </View>

      <Text style={[styles.reportSummary, { color: theme.colors.text, fontSize: getFontSize(14) }]} numberOfLines={2}>
        {item.summary}
      </Text>

      <View style={styles.reportFooter}>
        <Feather name="eye" size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.reportFooterText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
          Tap to view details
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: getFontSize(24) }]}>
          Medical Reports
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddReport}
          disabled={processingReport}
        >
          {processingReport ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Feather name="plus" size={24} color={theme.colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.warningLight }]}>
          <Feather name="alert-triangle" size={20} color={theme.colors.warning} />
          <Text style={[styles.errorText, { color: theme.colors.warning }]}>{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : reports.length > 0 ? (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="file-text" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
            No Medical Reports Yet
          </Text>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
            Tap the + button to add your first medical report
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddReport}
          >
            <Text style={[styles.emptyStateButtonText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
              Add Medical Report
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Options Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.uploadModalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
                Add Medical Report
              </Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={[styles.uploadOption, { backgroundColor: theme.colors.primaryLight }]}
                onPress={handleTakePhoto}
              >
                <Feather name="camera" size={32} color={theme.colors.primary} />
                <Text style={[styles.uploadOptionText, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Take Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadOption, { backgroundColor: theme.colors.primaryLight }]}
                onPress={handlePickImage}
              >
                <Feather name="image" size={32} color={theme.colors.primary} />
                <Text style={[styles.uploadOptionText, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Choose Image
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadOption, { backgroundColor: theme.colors.primaryLight }]}
                onPress={handlePickDocument}
              >
                <Feather name="file" size={32} color={theme.colors.primary} />
                <Text style={[styles.uploadOptionText, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Select Document
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Modal */}
      <Modal visible={processingReport} transparent={true} animationType="fade">
        <View style={styles.processingModalOverlay}>
          <View style={[styles.processingModalContent, { backgroundColor: theme.colors.card }]}>
            {previewImage && <Image source={{ uri: previewImage }} style={styles.previewImage} />}
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.processingLoader} />
            <Text style={[styles.processingText, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
              Processing Medical Report...
            </Text>
            <Text style={[styles.processingSubtext, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
              This may take a moment
            </Text>
          </View>
        </View>
      </Modal>

      {/* Report Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
                Report Details
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionTitle, { color: theme.colors.text, fontSize: getFontSize(22) }]}>
                    {selectedReport.title}
                  </Text>
                  <Text
                    style={[
                      styles.reportSectionSubtitle,
                      { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                    ]}
                  >
                    {selectedReport.date}
                  </Text>
                </View>

                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionHeading, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                    Healthcare Provider
                  </Text>
                  <View style={styles.reportDetail}>
                    <Text
                      style={[
                        styles.reportDetailLabel,
                        { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                      ]}
                    >
                      Doctor:
                    </Text>
                    <Text style={[styles.reportDetailValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                      {selectedReport.doctor}
                    </Text>
                  </View>
                  <View style={styles.reportDetail}>
                    <Text
                      style={[
                        styles.reportDetailLabel,
                        { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                      ]}
                    >
                      Hospital:
                    </Text>
                    <Text style={[styles.reportDetailValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                      {selectedReport.hospital}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionHeading, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                    Summary
                  </Text>
                  <Text style={[styles.reportText, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                    {selectedReport.summary}
                  </Text>
                </View>

                {selectedReport.metrics && Object.keys(selectedReport.metrics).length > 0 && (
                  <View style={styles.reportSection}>
                    <Text
                      style={[styles.reportSectionHeading, { color: theme.colors.text, fontSize: getFontSize(18) }]}
                    >
                      Health Metrics
                    </Text>
                    {Object.entries(selectedReport.metrics).map(([key, value], index) => (
                      <View key={index} style={styles.metricItem}>
                        <Text
                          style={[styles.metricLabel, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}
                        >
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:
                        </Text>
                        <Text style={[styles.metricValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={[styles.reportAction, { backgroundColor: theme.colors.primary }]}
                    onPress={handleExportReport}
                    disabled={exportLoading}
                  >
                    {exportLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                      <>
                        <Feather name="share" size={20} color={theme.colors.white} style={styles.actionIcon} />
                        <Text style={[styles.actionText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
                          Export Report
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.reportAction, { backgroundColor: theme.colors.danger }]}
                    onPress={() => handleDeleteReport(selectedReport.id)}
                  >
                    <Feather name="trash-2" size={20} color={theme.colors.white} style={styles.actionIcon} />
                    <Text style={[styles.actionText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
                      Delete Report
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: "Inter-Medium",
    marginLeft: 8,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  reportCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  reportTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reportTitle: {
    fontFamily: "Inter-Bold",
    marginLeft: 8,
  },
  reportDate: {
    fontFamily: "Inter-Regular",
  },
  reportDetails: {
    padding: 16,
  },
  reportDetail: {
    flexDirection: "row",
    marginBottom: 8,
  },
  reportDetailLabel: {
    fontFamily: "Inter-Medium",
    width: 80,
  },
  reportDetailValue: {
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  reportSummary: {
    fontFamily: "Inter-Regular",
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  reportFooterText: {
    fontFamily: "Inter-Regular",
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateTitle: {
    fontFamily: "Inter-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontFamily: "Inter-Bold",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "80%",
  },
  uploadModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontFamily: "Inter-Bold",
  },
  modalBody: {
    padding: 16,
  },
  reportSection: {
    marginBottom: 24,
  },
  reportSectionTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  reportSectionSubtitle: {
    fontFamily: "Inter-Regular",
    marginBottom: 16,
  },
  reportSectionHeading: {
    fontFamily: "Inter-Bold",
    marginBottom: 12,
  },
  reportText: {
    fontFamily: "Inter-Regular",
    lineHeight: 24,
  },
  metricItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
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
  reportActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 40,
  },
  reportAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontFamily: "Inter-Bold",
  },
  uploadOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  uploadOption: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    width: "30%",
    aspectRatio: 1,
  },
  uploadOptionText: {
    fontFamily: "Inter-Medium",
    marginTop: 8,
    textAlign: "center",
  },
  processingModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  processingModalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  processingLoader: {
    marginBottom: 16,
  },
  processingText: {
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
  processingSubtext: {
    fontFamily: "Inter-Regular",
    textAlign: "center",
    marginTop: 8,
  },
})
