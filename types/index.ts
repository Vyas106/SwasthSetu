// User types
export interface User {
  id: string
  name: string
  age?: number
  address?: string
  city?: string
  pincode?: string
  description?: string
  profileImage?: string
  medicalHistory?: {
    conditions: string[]
    allergies: string[]
    medications: string[]
  }
}

// Food types
export interface FoodEntry {
  id: string
  name: string
  calories: number
  time: string
  date?: Date
  imageUrl?: string | null
  nutritionalWarning?: string | null
}

export interface FoodDay {
  date: Date
  formattedDate: string
  totalCalories: number
  items: FoodEntry[]
}

// Medical types
export interface MedicalReport {
  id: string
  title: string
  date: string
  doctor: string
  hospital: string
  summary: string
  fileUrl: string
  metrics?: {
    [key: string]: string
  }
}

// Location types
export interface NearbyPlace {
  id: string
  name: string
  type: string
  distance: number
  address: string
  phone: string
  rating?: number
  location?: {
    latitude: number
    longitude: number
  }
}

// Emergency contact types
export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
}
