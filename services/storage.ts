import AsyncStorage from "@react-native-async-storage/async-storage"

// Save data to AsyncStorage
export const saveData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
    return true
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error)
    throw error
  }
}

// Get data from AsyncStorage
export const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error)
    throw error
  }
}

// Remove data from AsyncStorage
export const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error)
    throw error
  }
}

// Clear all data from AsyncStorage
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear()
    return true
  } catch (error) {
    console.error("Error clearing all data:", error)
    throw error
  }
}

// Get multiple items from AsyncStorage
export const getMultipleData = async (keys: string[]) => {
  try {
    const values = await AsyncStorage.multiGet(keys)
    return values.map(([key, value]) => [key, value ? JSON.parse(value) : null])
  } catch (error) {
    console.error("Error getting multiple data:", error)
    throw error
  }
}

// Save multiple items to AsyncStorage
export const saveMultipleData = async (keyValuePairs: [string, any][]) => {
  try {
    const pairs = keyValuePairs.map(([key, value]) => [key, JSON.stringify(value)])
    await AsyncStorage.multiSet(pairs as [string, string][])
    return true
  } catch (error) {
    console.error("Error saving multiple data:", error)
    throw error
  }
}

// Remove multiple items from AsyncStorage
export const removeMultipleData = async (keys: string[]) => {
  try {
    await AsyncStorage.multiRemove(keys)
    return true
  } catch (error) {
    console.error("Error removing multiple data:", error)
    throw error
  }
}

// Get all keys from AsyncStorage
export const getAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    return keys
  } catch (error) {
    console.error("Error getting all keys:", error)
    throw error
  }
}

// Check if a key exists in AsyncStorage
export const hasKey = async (key: string) => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    return keys.includes(key)
  } catch (error) {
    console.error(`Error checking if key ${key} exists:`, error)
    throw error
  }
}
