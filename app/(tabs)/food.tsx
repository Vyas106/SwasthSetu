"use client"

import { useState, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { useAuth } from "@/context/AuthContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { uploadToCloudinary } from "@/utils/cloudinary"
import { analyzeFoodImage } from "@/services/gemini"
import { saveFoodEntry, fetchFoodDays } from "@/services/firebase"
import type { FoodEntry, FoodDay } from "@/types"
import { useFocusEffect } from "expo-router"
import * as MediaLibrary from "expo-media-library"

export default function FoodScreen() {
  const { theme, getFontSize } = useTheme()
  const { user } = useAuth()
  const router = useRouter()

  const [foodDays, setFoodDays] = useState<FoodDay[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [processingImage, setProcessingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analyzedFood, setAnalyzedFood] = useState<FoodEntry | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [uploadOptionsVisible, setUploadOptionsVisible] = useState(false)

  const loadFoodData = useCallback(async () => {
    if (user) {
      try {
        setLoading(true)
        const data = await fetchFoodDays(user.id)
        setFoodDays(data)
      } catch (error) {
        console.error("Error loading food data:", error)
        Alert.alert("Error", "Failed to load food data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }, [user])

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFoodData()
    }, [loadFoodData]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadFoodData()
    setRefreshing(false)
  }, [loadFoodData])

  const handleAddFood = () => {
    setUploadOptionsVisible(true)
  }

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera permission is needed to take a photo of your food")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      processImage(result.assets[0].uri)
    }

    setUploadOptionsVisible(false)
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== "granted") {
      Alert.alert("Permission Denied", "Media library permission is needed to select a photo")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      processImage(result.assets[0].uri)
    }

    setUploadOptionsVisible(false)
  }

  const handleShareImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Media library permission is needed to share images")
        return
      }

      const result = await Share.share({
        title: "Share Food Image",
        message: "Share a food image to analyze",
      })

      if (result.action === Share.sharedAction && result.activityType) {
        // Shared successfully
        if (result.activityType === "com.apple.UIKit.activity.SaveToCameraRoll") {
          Alert.alert("Success", "Image saved to camera roll")
        }
      }
    } catch (error) {
      console.error("Error sharing:", error)
      Alert.alert("Error", "Failed to share. Please try again.")
    }

    setUploadOptionsVisible(false)
  }

  const processImage = async (imageUri: string) => {
    setSelectedImage(imageUri)
    setModalVisible(true)
    setProcessingImage(true)

    try {
      // Upload image to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(imageUri)

      // Analyze food image using Gemini
      const foodAnalysis = await analyzeFoodImage(cloudinaryUrl)

      setAnalyzedFood(foodAnalysis)
    } catch (error) {
      console.error("Error processing food image:", error)
      Alert.alert("Error", "Failed to analyze food image. Please try again.")
      setModalVisible(false)
    } finally {
      setProcessingImage(false)
    }
  }

  const handleSaveFoodEntry = async () => {
    if (!analyzedFood || !user) return

    try {
      setProcessingImage(true)

      // Save food entry to Firebase
      await saveFoodEntry(user.id, analyzedFood)

      // Refresh food data
      await loadFoodData()

      setModalVisible(false)
      setSelectedImage(null)
      setAnalyzedFood(null)

      Alert.alert("Success", "Food entry saved successfully")
    } catch (error) {
      console.error("Error saving food entry:", error)
      Alert.alert("Error", "Failed to save food entry. Please try again.")
    } finally {
      setProcessingImage(false)
    }
  }

  const navigateToDateDetail = (day: FoodDay) => {
    // Navigate to date detail page
    router.push({
      pathname: "/food/[date]",
      params: { date: day.date.toISOString() },
    })
  }

  const renderFoodDay = ({ item }: { item: FoodDay }) => (
    <TouchableOpacity
      style={[styles.dayCard, { backgroundColor: theme.colors.card }]}
      onPress={() => navigateToDateDetail(item)}
    >
      <View style={styles.dayHeader}>
        <Text style={[styles.dayTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
          {item.formattedDate}
        </Text>
        <Text style={[styles.dayCalories, { color: theme.colors.primary, fontSize: getFontSize(18) }]}>
          {item.totalCalories} cal
        </Text>
      </View>

      <View style={styles.dayItems}>
        {item.items.slice(0, 3).map((foodItem, index) => (
          <View
            key={foodItem.id}
            style={[
              styles.foodItem,
              index < Math.min(item.items.length, 3) - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.foodItemLeft}>
              <Text style={[styles.foodItemName, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                {foodItem.name}
              </Text>
              <Text style={[styles.foodItemTime, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
                {foodItem.time}
              </Text>
            </View>
            <Text style={[styles.foodItemCalories, { color: theme.colors.primary, fontSize: getFontSize(16) }]}>
              {foodItem.calories} cal
            </Text>
          </View>
        ))}

        {item.items.length > 3 && (
          <Text style={[styles.moreItems, { color: theme.colors.primary, fontSize: getFontSize(14) }]}>
            +{item.items.length - 3} more items
          </Text>
        )}
      </View>

      <View style={styles.dayFooter}>
        <Feather name="calendar" size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.dayFooterText, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}>
          Tap to view details
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: getFontSize(24) }]}>Food Journal</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={handleAddFood}>
          <Feather name="plus" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : foodDays.length > 0 ? (
        <FlatList
          data={foodDays}
          renderItem={renderFoodDay}
          keyExtractor={(item) => item.date.toISOString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="coffee" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
            No Food Entries Yet
          </Text>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary, fontSize: getFontSize(16) }]}>
            Tap the + button to add your first meal
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddFood}
          >
            <Text style={[styles.emptyStateButtonText, { color: theme.colors.white, fontSize: getFontSize(16) }]}>
              Add Food Entry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Options Modal */}
      <Modal
        visible={uploadOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUploadOptionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.uploadOptionsContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
                Add Food Entry
              </Text>
              <TouchableOpacity onPress={() => setUploadOptionsVisible(false)}>
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
                onPress={handleShareImage}
              >
                <Feather name="share-2" size={32} color={theme.colors.primary} />
                <Text style={[styles.uploadOptionText, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                  Share Image
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Food Analysis Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !processingImage && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
                Food Analysis
              </Text>
              {!processingImage && (
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {processingImage ? (
              <View style={styles.processingContainer}>
                {selectedImage && <Image source={{ uri: selectedImage }} style={styles.processingImage} />}
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.processingLoader} />
                <Text style={[styles.processingText, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                  Analyzing your food...
                </Text>
                <Text
                  style={[styles.processingSubtext, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                >
                  This may take a moment
                </Text>
              </View>
            ) : (
              <>
                {selectedImage && <Image source={{ uri: selectedImage }} style={styles.foodImage} />}

                {analyzedFood && (
                  <ScrollView style={styles.analysisResults}>
                    <Text style={[styles.analysisTitle, { color: theme.colors.text, fontSize: getFontSize(20) }]}>
                      {analyzedFood.name}
                    </Text>

                    {analyzedFood.description && (
                      <Text
                        style={[
                          styles.analysisDescription,
                          { color: theme.colors.textSecondary, fontSize: getFontSize(14) },
                        ]}
                      >
                        {analyzedFood.description}
                      </Text>
                    )}

                    <View style={styles.macronutrientSection}>
                      <View style={styles.nutritionItem}>
                        <Text
                          style={[
                            styles.nutritionLabel,
                            { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                          ]}
                        >
                          Calories:
                        </Text>
                        <Text style={[styles.nutritionValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}>
                          {analyzedFood.calories} cal
                        </Text>
                      </View>

                      {analyzedFood.nutritionalInfo && (
                        <>
                          <View style={styles.nutritionItem}>
                            <Text
                              style={[
                                styles.nutritionLabel,
                                { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                              ]}
                            >
                              Protein:
                            </Text>
                            <Text
                              style={[styles.nutritionValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}
                            >
                              {analyzedFood.nutritionalInfo.protein}g
                            </Text>
                          </View>

                          <View style={styles.nutritionItem}>
                            <Text
                              style={[
                                styles.nutritionLabel,
                                { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                              ]}
                            >
                              Carbs:
                            </Text>
                            <Text
                              style={[styles.nutritionValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}
                            >
                              {analyzedFood.nutritionalInfo.carbs}g
                            </Text>
                          </View>

                          <View style={styles.nutritionItem}>
                            <Text
                              style={[
                                styles.nutritionLabel,
                                { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                              ]}
                            >
                              Fat:
                            </Text>
                            <Text
                              style={[styles.nutritionValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}
                            >
                              {analyzedFood.nutritionalInfo.fat}g
                            </Text>
                          </View>

                          <View style={styles.nutritionItem}>
                            <Text
                              style={[
                                styles.nutritionLabel,
                                { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                              ]}
                            >
                              Fiber:
                            </Text>
                            <Text
                              style={[styles.nutritionValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}
                            >
                              {analyzedFood.nutritionalInfo.fiber}g
                            </Text>
                          </View>

                          <View style={styles.nutritionItem}>
                            <Text
                              style={[
                                styles.nutritionLabel,
                                { color: theme.colors.textSecondary, fontSize: getFontSize(16) },
                              ]}
                            >
                              Sugar:
                            </Text>
                            <Text
                              style={[styles.nutritionValue, { color: theme.colors.text, fontSize: getFontSize(16) }]}
                            >
                              {analyzedFood.nutritionalInfo.sugar}g
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {/* Vitamins & Minerals Section */}
                    {analyzedFood.nutritionalInfo &&
                      analyzedFood.nutritionalInfo.vitamins &&
                      analyzedFood.nutritionalInfo.vitamins.length > 0 && (
                        <View style={styles.micronutrientSection}>
                          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                            Vitamins & Minerals
                          </Text>

                          <View style={styles.micronutrientGrid}>
                            {analyzedFood.nutritionalInfo.vitamins.slice(0, 4).map((vitamin, index) => (
                              <View key={`vitamin-${index}`} style={styles.micronutrientItem}>
                                <Text
                                  style={[
                                    styles.micronutrientName,
                                    { color: theme.colors.primary, fontSize: getFontSize(14) },
                                  ]}
                                >
                                  {vitamin.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.micronutrientValue,
                                    { color: theme.colors.text, fontSize: getFontSize(12) },
                                  ]}
                                >
                                  {vitamin.amount}
                                </Text>
                              </View>
                            ))}

                            {analyzedFood.nutritionalInfo.minerals.slice(0, 4).map((mineral, index) => (
                              <View key={`mineral-${index}`} style={styles.micronutrientItem}>
                                <Text
                                  style={[
                                    styles.micronutrientName,
                                    { color: theme.colors.primary, fontSize: getFontSize(14) },
                                  ]}
                                >
                                  {mineral.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.micronutrientValue,
                                    { color: theme.colors.text, fontSize: getFontSize(12) },
                                  ]}
                                >
                                  {mineral.amount}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                    {/* Ingredients Section */}
                    {analyzedFood.ingredients && analyzedFood.ingredients.length > 0 && (
                      <View style={styles.ingredientsSection}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                          Ingredients
                        </Text>

                        <View style={styles.ingredientsList}>
                          {analyzedFood.ingredients.slice(0, 6).map((ingredient, index) => (
                            <View key={index} style={styles.ingredientItem}>
                              <Feather
                                name="check"
                                size={16}
                                color={theme.colors.primary}
                                style={styles.ingredientIcon}
                              />
                              <Text
                                style={[styles.ingredientText, { color: theme.colors.text, fontSize: getFontSize(14) }]}
                              >
                                {typeof ingredient === "string" ? ingredient : ingredient.name || "Unknown"}
                              </Text>
                            </View>
                          ))}

                          {analyzedFood.ingredients.length > 6 && (
                            <Text
                              style={[
                                styles.moreIngredients,
                                { color: theme.colors.primary, fontSize: getFontSize(14) },
                              ]}
                            >
                              +{analyzedFood.ingredients.length - 6} more ingredients
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Health Benefits Section */}
                    {analyzedFood.healthBenefits && analyzedFood.healthBenefits.length > 0 && (
                      <View style={styles.benefitsSection}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                          Health Benefits
                        </Text>

                        <View style={styles.benefitsList}>
                          {analyzedFood.healthBenefits.slice(0, 3).map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                              <Feather name="heart" size={16} color={theme.colors.success} style={styles.benefitIcon} />
                              <Text
                                style={[styles.benefitText, { color: theme.colors.text, fontSize: getFontSize(14) }]}
                              >
                                {benefit}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Dietary Classifications */}
                    {analyzedFood.dietaryClassifications && analyzedFood.dietaryClassifications.length > 0 && (
                      <View style={styles.dietarySection}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: getFontSize(18) }]}>
                          Dietary Information
                        </Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dietaryScrollView}>
                          {analyzedFood.dietaryClassifications.map((classification, index) => (
                            <View
                              key={index}
                              style={[styles.dietaryTag, { backgroundColor: theme.colors.primaryLight }]}
                            >
                              <Text
                                style={[styles.dietaryText, { color: theme.colors.primary, fontSize: getFontSize(14) }]}
                              >
                                {classification}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Nutritional Warning */}
                    {analyzedFood.nutritionalWarning && (
                      <View style={[styles.warningBox, { backgroundColor: theme.colors.warningLight }]}>
                        <Feather name="alert-triangle" size={20} color={theme.colors.warning} />
                        <Text style={[styles.warningText, { color: theme.colors.warning, fontSize: getFontSize(14) }]}>
                          {analyzedFood.nutritionalWarning}
                        </Text>
                      </View>
                    )}

                    {/* Cultural Origin */}
                    {analyzedFood.culturalOrigin && (
                      <View style={styles.originSection}>
                        <Text
                          style={[styles.originLabel, { color: theme.colors.textSecondary, fontSize: getFontSize(14) }]}
                        >
                          Cultural Origin:
                        </Text>
                        <Text style={[styles.originValue, { color: theme.colors.text, fontSize: getFontSize(14) }]}>
                          {analyzedFood.culturalOrigin}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleSaveFoodEntry}
                    >
                      <Text style={[styles.saveButtonText, { color: theme.colors.white, fontSize: getFontSize(18) }]}>
                        Save to Food Journal
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  dayCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  dayTitle: {
    fontFamily: "Inter-Bold",
  },
  dayCalories: {
    fontFamily: "Inter-Bold",
  },
  dayItems: {
    paddingHorizontal: 16,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  foodItemLeft: {
    flex: 1,
  },
  foodItemName: {
    fontFamily: "Inter-Medium",
  },
  foodItemTime: {
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  foodItemCalories: {
    fontFamily: "Inter-Bold",
  },
  moreItems: {
    fontFamily: "Inter-Medium",
    textAlign: "center",
    paddingVertical: 8,
  },
  dayFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  dayFooterText: {
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
    paddingBottom: 24,
    maxHeight: "80%",
  },
  uploadOptionsContent: {
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
  processingContainer: {
    alignItems: "center",
    padding: 24,
  },
  processingImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 24,
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
  foodImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  analysisResults: {
    padding: 16,
  },
  analysisTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 16,
  },
  nutritionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  nutritionLabel: {
    fontFamily: "Inter-Regular",
  },
  nutritionValue: {
    fontFamily: "Inter-Bold",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  warningText: {
    fontFamily: "Inter-Medium",
    marginLeft: 8,
    flex: 1,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  saveButtonText: {
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
  analysisDescription: {
    fontFamily: "Inter-Regular",
    marginBottom: 16,
  },
  macronutrientSection: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    fontFamily: "Inter-Bold",
    marginBottom: 12,
  },
  micronutrientSection: {
    marginTop: 24,
  },
  micronutrientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  micronutrientItem: {
    width: "48%",
    marginBottom: 12,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
  },
  micronutrientName: {
    fontFamily: "Inter-Medium",
    marginBottom: 4,
  },
  micronutrientValue: {
    fontFamily: "Inter-Regular",
  },
  ingredientsSection: {
    marginTop: 24,
  },
  ingredientsList: {
    marginLeft: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ingredientIcon: {
    marginRight: 8,
  },
  ingredientText: {
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  moreIngredients: {
    fontFamily: "Inter-Medium",
    marginTop: 4,
    marginLeft: 24,
  },
  benefitsSection: {
    marginTop: 24,
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitIcon: {
    marginRight: 8,
  },
  benefitText: {
    fontFamily: "Inter-Regular",
    flex: 1,
  },
  dietarySection: {
    marginTop: 24,
  },
  dietaryScrollView: {
    marginBottom: 12,
  },
  dietaryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  dietaryText: {
    fontFamily: "Inter-Medium",
  },
  originSection: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  originLabel: {
    fontFamily: "Inter-Medium",
    marginRight: 8,
  },
  originValue: {
    fontFamily: "Inter-Regular",
  },
})
