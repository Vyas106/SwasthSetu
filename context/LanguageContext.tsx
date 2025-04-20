"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { translateText } from "@/services/gemini"

type Language = "english" | "hindi" | "gujarati"

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => Promise<void>
  translate: (text: string) => Promise<string>
  isTranslating: boolean
  translateUI: (text: string) => string
  translatedTexts: Record<string, Record<string, string>>
}

// Common UI texts in different languages
const UI_TRANSLATIONS = {
  english: {
    home: "Home",
    food: "Food",
    medical: "Medical",
    profile: "Profile",
    reminders: "Reminders",
    upcoming: "upcoming",
    addReminder: "Add Reminder",
    noUpcomingReminders: "No upcoming reminders",
    today: "Today",
    healthTrends: "Health Trends",
    lastDays: "Last 7 days",
    healthScore: "Health Score",
    weeklyChange: "Weekly Change",
    overallStatus: "Overall Status",
    todaysNutrition: "Today's Nutrition",
    quickActions: "Quick Actions",
    nearby: "Nearby",
    reminder: "Reminder",
    see: "See",
    goodMorning: "Good Morning",
    heresYourHealth: "Here's your health summary for today",
    aiSuggestions: "AI Suggestions",
    nearbyPlaces: "Nearby Places",
    objectDetection: "Object Detection",
    detectionResults: "Detection Results",
    speakAgain: "Speak Again",
    stop: "Stop",
    speaking: "Speaking...",
    modelLoadingError: "Failed to load the object detection model. Please try again or check your internet connection.",
    requestingPermission: "Requesting camera permission...",
    cameraAccessDenied: "Camera access denied. Please enable camera permissions in your device settings.",
    loadingModel: "Loading object detection model...",
    thisWillTake: "This may take a moment on first launch",
    processing: "Processing...",
    continuous: "Continuous",
    single: "Single",
  },
  hindi: {
    home: "होम",
    food: "भोजन",
    medical: "चिकित्सा",
    profile: "प्रोफाइल",
    reminders: "रिमाइंडर",
    upcoming: "आगामी",
    addReminder: "रिमाइंडर जोड़ें",
    noUpcomingReminders: "कोई आगामी रिमाइंडर नहीं",
    today: "आज",
    healthTrends: "स्वास्थ्य रुझान",
    lastDays: "पिछले 7 दिन",
    healthScore: "स्वास्थ्य स्कोर",
    weeklyChange: "साप्ताहिक परिवर्तन",
    overallStatus: "समग्र स्थिति",
    todaysNutrition: "आज का पोषण",
    quickActions: "त्वरित कार्य",
    nearby: "आस-पास",
    reminder: "रिमाइंडर",
    see: "देखें",
    goodMorning: "सुप्रभात",
    heresYourHealth: "आज के लिए आपका स्वास्थ्य सारांश यहां है",
    aiSuggestions: "एआई सुझाव",
    nearbyPlaces: "आस-पास के स्थान",
    objectDetection: "वस्तु पहचान",
    detectionResults: "पहचान परिणाम",
    speakAgain: "फिर से बोलें",
    stop: "रोकें",
    speaking: "बोल रहा है...",
    modelLoadingError: "वस्तु पहचान मॉडल लोड करने में विफल। कृपया पुनः प्रयास करें या अपने इंटरनेट कनेक्शन की जांच करें।",
    requestingPermission: "कैमरा अनुमति का अनुरोध कर रहा है...",
    cameraAccessDenied: "कैमरा एक्सेस अस्वीकृत। कृपया अपनी डिवाइस सेटिंग्स में कैमरा अनुमतियां सक्षम करें।",
    loadingModel: "वस्तु पहचान मॉडल लोड हो रहा है...",
    thisWillTake: "पहली बार लॉन्च होने पर इसमें कुछ समय लग सकता है",
    processing: "प्रोसेसिंग...",
    continuous: "निरंतर",
    single: "एकल",
  },
  gujarati: {
    home: "હોમ",
    food: "ખોરાક",
    medical: "તબીબી",
    profile: "પ્રોફાઇલ",
    reminders: "રિમાઇન્ડર્સ",
    upcoming: "આવનારા",
    addReminder: "રિમાઇન્ડર ઉમેરો",
    noUpcomingReminders: "કોઈ આવનારા રિમાઇન્ડર્સ નથી",
    today: "આજે",
    healthTrends: "આરોગ્ય ટ્રેન્ડ્સ",
    lastDays: "છેલ્લા 7 દિવસ",
    healthScore: "આરોગ્ય સ્કોર",
    weeklyChange: "સાપ્તાહિક ફેરફાર",
    overallStatus: "સમગ્ર સ્થિતિ",
    todaysNutrition: "આજનું પોષણ",
    quickActions: "ઝડપી ક્રિયાઓ",
    nearby: "નજીકમાં",
    reminder: "રિમાઇન્ડર",
    see: "જુઓ",
    goodMorning: "સુપ્રભાત",
    heresYourHealth: "આજ માટે તમારો આરોગ્ય સારાંશ અહીં છે",
    aiSuggestions: "AI સૂચનો",
    nearbyPlaces: "નજીકના સ્થળો",
    objectDetection: "વસ્તુ શોધ",
    detectionResults: "શોધ પરિણામો",
    speakAgain: "ફરીથી બોલો",
    stop: "રોકો",
    speaking: "બોલી રહ્યું છે...",
    modelLoadingError: "વસ્તુ શોધ મોડેલ લોડ કરવામાં નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો અથવા તમારા ઇન્ટરનેટ કનેક્શનની તપાસ કરો.",
    requestingPermission: "કેમેરા પરવાનગી માટે વિનંતી કરી રહ્યા છીએ...",
    cameraAccessDenied: "કેમેરા ઍક્સેસ નકારવામાં આવી. કૃપા કરીને તમારા ડિવાઇસ સેટિંગ્સમાં કેમેરા પરવાનગીઓ સક્ષમ કરો.",
    loadingModel: "વસ્તુ શોધ મોડેલ લોડ થઈ રહ્યું છે...",
    thisWillTake: "પ્રથમ લોન્ચ પર આ થોડો સમય લઈ શકે છે",
    processing: "પ્રોસેસિંગ...",
    continuous: "સતત",
    single: "એકલ",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("english")
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, Record<string, string>>>(UI_TRANSLATIONS)

  // Load saved language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("language")
        if (
          savedLanguage &&
          (savedLanguage === "english" || savedLanguage === "hindi" || savedLanguage === "gujarati")
        ) {
          setLanguageState(savedLanguage as Language)
        }
      } catch (error) {
        console.error("Error loading language preference:", error)
      }
    }

    loadLanguagePreference()
  }, [])

  const setLanguage = async (newLanguage: Language) => {
    try {
      setLanguageState(newLanguage)
      await AsyncStorage.setItem("language", newLanguage)
    } catch (error) {
      console.error("Error saving language preference:", error)
    }
  }

  const translate = async (text: string): Promise<string> => {
    if (language === "english" || !text) {
      return text
    }

    try {
      setIsTranslating(true)
      const translatedText = await translateText(text, language)
      return translatedText || text
    } catch (error) {
      console.error("Translation error:", error)
      return text
    } finally {
      setIsTranslating(false)
    }
  }

  // Function to get UI text translations
  const translateUI = (text: string): string => {
    const key = text.toLowerCase().replace(/\s+/g, "")
    // First check if we have a direct match in our translations
    for (const [uiKey, uiValue] of Object.entries(translatedTexts[language] || {})) {
      if (uiKey.toLowerCase() === key || uiValue.toLowerCase() === text.toLowerCase()) {
        return uiValue
      }
    }

    // If no direct match, try to find a key that contains the text
    for (const [uiKey, uiValue] of Object.entries(translatedTexts[language] || {})) {
      if (uiKey.toLowerCase().includes(key) || key.includes(uiKey.toLowerCase())) {
        return uiValue
      }
    }

    // If still no match, return the original text
    return text
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate, isTranslating, translateUI, translatedTexts }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
