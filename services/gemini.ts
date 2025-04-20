// // // // // // // import { GoogleGenerativeAI } from "@google/generative-ai"
// // // // // // // import * as FileSystem from "expo-file-system"
// // // // // // // import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
// // // // // // // import Constants from "expo-constants"

// // // // // // // // Initialize the Google Generative AI with your API key
// // // // // // // const GOOGLE_API_KEY =
// // // // // // //   Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
// // // // // // // const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// // // // // // // // Convert an image to base64 for Gemini API
// // // // // // // async function fileToGenerativePart(imageUri: string) {
// // // // // // //   try {
// // // // // // //     // For remote URLs, fetch and encode
// // // // // // //     if (imageUri.startsWith("http")) {
// // // // // // //       // Download the image to a local file
// // // // // // //       const fileUri = FileSystem.cacheDirectory + "temp_image.jpg"
// // // // // // //       await FileSystem.downloadAsync(imageUri, fileUri)

// // // // // // //       // Resize and compress the image if needed (to reduce size)
// // // // // // //       const manipResult = await manipulateAsync(
// // // // // // //         fileUri,
// // // // // // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // // // // // //         { compress: 0.8, format: SaveFormat.JPEG },
// // // // // // //       )

// // // // // // //       // Read as base64
// // // // // // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // // // // // //         encoding: FileSystem.EncodingType.Base64,
// // // // // // //       })

// // // // // // //       return {
// // // // // // //         inlineData: {
// // // // // // //           data: base64,
// // // // // // //           mimeType: "image/jpeg",
// // // // // // //         },
// // // // // // //       }
// // // // // // //     }
// // // // // // //     // For local file URIs (like from camera)
// // // // // // //     else {
// // // // // // //       // Resize and compress the image if needed
// // // // // // //       const manipResult = await manipulateAsync(
// // // // // // //         imageUri,
// // // // // // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // // // // // //         { compress: 0.8, format: SaveFormat.JPEG },
// // // // // // //       )

// // // // // // //       // Read as base64
// // // // // // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // // // // // //         encoding: FileSystem.EncodingType.Base64,
// // // // // // //       })

// // // // // // //       return {
// // // // // // //         inlineData: {
// // // // // // //           data: base64,
// // // // // // //           mimeType: "image/jpeg",
// // // // // // //         },
// // // // // // //       }
// // // // // // //     }
// // // // // // //   } catch (error) {
// // // // // // //     console.error("Error processing image:", error)
// // // // // // //     throw new Error("Failed to process image")
// // // // // // //   }
// // // // // // // }

// // // // // // // // Analyze food image using Gemini
// // // // // // // export const analyzeFoodImage = async (imageUri: string) => {
// // // // // // //   try {
// // // // // // //     if (!GOOGLE_API_KEY) {
// // // // // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // // // // //     }

// // // // // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
// // // // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // // // //     // Convert image to format required by Gemini
// // // // // // //     const imagePart = await fileToGenerativePart(imageUri)

// // // // // // //     const prompt = `
// // // // // // //       Analyze this food image and provide the following information:
// // // // // // //       1. What food item(s) are in the image?
// // // // // // //       2. Estimate the calories in this meal
// // // // // // //       3. Identify any nutritional warnings (high salt, sugar, fat, etc.)
      
// // // // // // //       Format your response as a valid JSON object with the following structure:
// // // // // // //       {
// // // // // // //         "name": "Food name",
// // // // // // //         "calories": number,
// // // // // // //         "nutritionalWarning": "Warning message or null if none"
// // // // // // //       }
      
// // // // // // //       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
// // // // // // //     `

// // // // // // //     // Generate content
// // // // // // //     const result = await model.generateContent([prompt, imagePart])
// // // // // // //     const response = await result.response
// // // // // // //     const text = response.text().trim()

// // // // // // //     // Parse the JSON response with error handling
// // // // // // //     let foodAnalysis
// // // // // // //     try {
// // // // // // //       // Clean the text to ensure it's valid JSON
// // // // // // //       // Remove any markdown code block indicators if present
// // // // // // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // // // // // //       foodAnalysis = JSON.parse(cleanedText)
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Error parsing JSON response:", error, "Raw response:", text)
// // // // // // //       // Fallback if JSON parsing fails
// // // // // // //       foodAnalysis = {
// // // // // // //         name: "Unknown food item",
// // // // // // //         calories: 0,
// // // // // // //         nutritionalWarning: "Could not analyze nutritional content",
// // // // // // //       }
// // // // // // //     }

// // // // // // //     // Add current time
// // // // // // //     const now = new Date()
// // // // // // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // // // // // //     return {
// // // // // // //       id: Date.now().toString(),
// // // // // // //       name: foodAnalysis.name || "Unknown food",
// // // // // // //       calories: foodAnalysis.calories || 0,
// // // // // // //       nutritionalWarning: foodAnalysis.nutritionalWarning || null,
// // // // // // //       time: timeString,
// // // // // // //       imageUrl: imageUri,
// // // // // // //     }
// // // // // // //   } catch (error) {
// // // // // // //     console.error("Error analyzing food image:", error)
// // // // // // //     // Return a fallback response instead of throwing
// // // // // // //     const now = new Date()
// // // // // // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // // // // // //     return {
// // // // // // //       id: Date.now().toString(),
// // // // // // //       name: "Food item (analysis failed)",
// // // // // // //       calories: 0,
// // // // // // //       nutritionalWarning: "Could not analyze nutritional content",
// // // // // // //       time: timeString,
// // // // // // //       imageUrl: imageUri,
// // // // // // //     }
// // // // // // //   }
// // // // // // // }

// // // // // // // // Analyze medical report using Gemini
// // // // // // // export const analyzeMedicalReport = async (reportUri: string) => {
// // // // // // //   try {
// // // // // // //     if (!GOOGLE_API_KEY) {
// // // // // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // // // // //     }

// // // // // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
// // // // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // // // //     // Convert image to format required by Gemini
// // // // // // //     const reportPart = await fileToGenerativePart(reportUri)

// // // // // // //     const prompt = `
// // // // // // //       Analyze this medical report and extract the following information:
// // // // // // //       1. Title/type of the report
// // // // // // //       2. Date of the report
// // // // // // //       3. Doctor's name
// // // // // // //       4. Hospital/clinic name
// // // // // // //       5. A brief summary of the findings
// // // // // // //       6. Key health metrics (blood pressure, heart rate, cholesterol, etc.)
      
// // // // // // //       Format your response as a valid JSON object with the following structure:
// // // // // // //       {
// // // // // // //         "title": "Report title",
// // // // // // //         "date": "YYYY-MM-DD",
// // // // // // //         "doctor": "Doctor name",
// // // // // // //         "hospital": "Hospital name",
// // // // // // //         "summary": "Brief summary of findings",
// // // // // // //         "metrics": {
// // // // // // //           "metric1": "value1",
// // // // // // //           "metric2": "value2"
// // // // // // //         }
// // // // // // //       }
      
// // // // // // //       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
// // // // // // //     `

// // // // // // //     // Generate content
// // // // // // //     const result = await model.generateContent([prompt, reportPart])
// // // // // // //     const response = await result.response
// // // // // // //     const text = response.text().trim()

// // // // // // //     // Parse the JSON response with error handling
// // // // // // //     let reportAnalysis
// // // // // // //     try {
// // // // // // //       // Clean the text to ensure it's valid JSON
// // // // // // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // // // // // //       reportAnalysis = JSON.parse(cleanedText)
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Error parsing JSON response:", error, "Raw response:", text)
// // // // // // //       // Fallback if JSON parsing fails
// // // // // // //       const today = new Date().toISOString().split("T")[0]
// // // // // // //       reportAnalysis = {
// // // // // // //         title: "Medical Report",
// // // // // // //         date: today,
// // // // // // //         doctor: "Unknown Doctor",
// // // // // // //         hospital: "Unknown Hospital",
// // // // // // //         summary: "Could not analyze report content",
// // // // // // //         metrics: {},
// // // // // // //       }
// // // // // // //     }

// // // // // // //     return {
// // // // // // //       id: Date.now().toString(),
// // // // // // //       title: reportAnalysis.title || "Medical Report",
// // // // // // //       date: reportAnalysis.date || new Date().toISOString().split("T")[0],
// // // // // // //       doctor: reportAnalysis.doctor || "Unknown Doctor",
// // // // // // //       hospital: reportAnalysis.hospital || "Unknown Hospital",
// // // // // // //       summary: reportAnalysis.summary || "Could not analyze report content",
// // // // // // //       metrics: reportAnalysis.metrics || {},
// // // // // // //       fileUrl: reportUri,
// // // // // // //     }
// // // // // // //   } catch (error) {
// // // // // // //     console.error("Error analyzing medical report:", error)
// // // // // // //     // Return a fallback response instead of throwing
// // // // // // //     const today = new Date().toISOString().split("T")[0]
// // // // // // //     return {
// // // // // // //       id: Date.now().toString(),
// // // // // // //       title: "Medical Report (Analysis Failed)",
// // // // // // //       date: today,
// // // // // // //       doctor: "Unknown Doctor",
// // // // // // //       hospital: "Unknown Hospital",
// // // // // // //       summary: "Could not analyze report content",
// // // // // // //       metrics: {},
// // // // // // //       fileUrl: reportUri,
// // // // // // //     }
// // // // // // //   }
// // // // // // // }

// // // // // // // // Get AI suggestions based on health and food data
// // // // // // // export const getAiSuggestions = async (healthData: any, foodData: any) => {
// // // // // // //   try {
// // // // // // //     if (!GOOGLE_API_KEY) {
// // // // // // //       return "Add your Gemini API key to get personalized health suggestions based on your data."
// // // // // // //     }

// // // // // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro
// // // // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // // // //     const prompt = `
// // // // // // //       Based on the following health and food data, provide personalized suggestions for an elderly person:
      
// // // // // // //       Health Data: ${JSON.stringify(healthData)}
// // // // // // //       Food Data: ${JSON.stringify(foodData)}
      
// // // // // // //       Provide suggestions for:
// // // // // // //       1. Physical activities appropriate for elderly
// // // // // // //       2. Dietary recommendations
// // // // // // //       3. Health monitoring tips
      
// // // // // // //       Keep your response concise, friendly, and easy to understand for an elderly person. 
// // // // // // //       Use simple language and focus on practical advice.
// // // // // // //       Limit your response to 3-4 sentences.
// // // // // // //     `

// // // // // // //     // Generate content
// // // // // // //     const result = await model.generateContent(prompt)
// // // // // // //     const response = await result.response
// // // // // // //     return response.text()
// // // // // // //   } catch (error) {
// // // // // // //     console.error("Error getting AI suggestions:", error)
// // // // // // //     return "Try taking a 15-minute walk today and stay hydrated. Include more colorful vegetables in your meals and consider reducing salt intake. Remember to measure your blood pressure regularly and take medications as prescribed."
// // // // // // //   }
// // // // // // // }

// // // // // // // // Get medical report recommendations
// // // // // // // export const getMedicalReportRecommendations = async (reportData: any, isVegetarian = true) => {
// // // // // // //   try {
// // // // // // //     if (!GOOGLE_API_KEY) {
// // // // // // //       return {
// // // // // // //         medications: ["Please add your Gemini API key to get personalized medication recommendations."],
// // // // // // //         diet: ["Please add your Gemini API key to get personalized diet recommendations."],
// // // // // // //         activities: ["Please add your Gemini API key to get personalized activity recommendations."],
// // // // // // //         precautions: ["Please add your Gemini API key to get personalized precaution recommendations."],
// // // // // // //       }
// // // // // // //     }

// // // // // // //     // Access the model
// // // // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // // // //     const dietType = isVegetarian ? "vegetarian" : "non-vegetarian"

// // // // // // //     const prompt = `
// // // // // // //       Based on the following medical report data, provide personalized recommendations for an Indian patient:
      
// // // // // // //       Medical Report: ${JSON.stringify(reportData)}
// // // // // // //       Diet Preference: ${dietType}
      
// // // // // // //       Format your response as a valid JSON object with the following structure:
// // // // // // //       {
// // // // // // //         "medications": ["medication 1", "medication 2"],
// // // // // // //         "diet": ["diet recommendation 1", "diet recommendation 2", "diet recommendation 3"],
// // // // // // //         "activities": ["activity 1", "activity 2"],
// // // // // // //         "precautions": ["precaution 1", "precaution 2"]
// // // // // // //       }
      
// // // // // // //       For medications, suggest common Indian generic medicines if applicable.
// // // // // // //       For diet, suggest specific Indian ${dietType} foods that would be beneficial.
// // // // // // //       For activities, suggest appropriate physical activities considering the patient's condition.
// // // // // // //       For precautions, suggest specific things to avoid or be careful about.
      
// // // // // // //       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
// // // // // // //       Limit each array to 3-5 items for readability.
// // // // // // //     `

// // // // // // //     // Generate content
// // // // // // //     const result = await model.generateContent(prompt)
// // // // // // //     const response = await result.response
// // // // // // //     const text = response.text().trim()

// // // // // // //     // Parse the JSON response with error handling
// // // // // // //     try {
// // // // // // //       // Clean the text to ensure it's valid JSON
// // // // // // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // // // // // //       return JSON.parse(cleanedText)
// // // // // // //     } catch (error) {
// // // // // // //       console.error("Error parsing JSON response:", error, "Raw response:", text)
// // // // // // //       // Fallback if JSON parsing fails
// // // // // // //       return {
// // // // // // //         medications: ["Consult your doctor for appropriate medications"],
// // // // // // //         diet: [
// // // // // // //           isVegetarian
// // // // // // //             ? "Fresh fruits and vegetables, whole grains, and dairy products"
// // // // // // //             : "Fresh fruits and vegetables, whole grains, lean meats, and fish",
// // // // // // //           "Stay hydrated with water and fresh juices",
// // // // // // //           "Avoid processed foods and excess sugar",
// // // // // // //         ],
// // // // // // //         activities: ["Light walking as tolerated", "Gentle stretching exercises", "Rest adequately"],
// // // // // // //         precautions: ["Follow your doctor's advice", "Take medications as prescribed", "Monitor your symptoms"],
// // // // // // //       }
// // // // // // //     }
// // // // // // //   } catch (error) {
// // // // // // //     console.error("Error getting medical recommendations:", error)
// // // // // // //     return {
// // // // // // //       medications: ["Consult your doctor for appropriate medications"],
// // // // // // //       diet: [
// // // // // // //         isVegetarian
// // // // // // //           ? "Fresh fruits and vegetables, whole grains, and dairy products"
// // // // // // //           : "Fresh fruits and vegetables, whole grains, lean meats, and fish",
// // // // // // //         "Stay hydrated with water and fresh juices",
// // // // // // //         "Avoid processed foods and excess sugar",
// // // // // // //       ],
// // // // // // //       activities: ["Light walking as tolerated", "Gentle stretching exercises", "Rest adequately"],
// // // // // // //       precautions: ["Follow your doctor's advice", "Take medications as prescribed", "Monitor your symptoms"],
// // // // // // //     }
// // // // // // //   }
// // // // // // // }


// // // // // // import { GoogleGenerativeAI } from "@google/generative-ai"
// // // // // // import * as FileSystem from "expo-file-system"
// // // // // // import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
// // // // // // import Constants from "expo-constants"

// // // // // // // Initialize the Google Generative AI with your API key
// // // // // // const GOOGLE_API_KEY =
// // // // // //   Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
// // // // // // const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// // // // // // // Convert an image to base64 for Gemini API
// // // // // // async function fileToGenerativePart(imageUri: string) {
// // // // // //   try {
// // // // // //     // For remote URLs, fetch and encode
// // // // // //     if (imageUri.startsWith("http")) {
// // // // // //       // Download the image to a local file
// // // // // //       const fileUri = FileSystem.cacheDirectory + "temp_image.jpg"
// // // // // //       await FileSystem.downloadAsync(imageUri, fileUri)

// // // // // //       // Resize and compress the image if needed (to reduce size)
// // // // // //       const manipResult = await manipulateAsync(
// // // // // //         fileUri,
// // // // // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // // // // //         { compress: 0.8, format: SaveFormat.JPEG },
// // // // // //       )

// // // // // //       // Read as base64
// // // // // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // // // // //         encoding: FileSystem.EncodingType.Base64,
// // // // // //       })

// // // // // //       return {
// // // // // //         inlineData: {
// // // // // //           data: base64,
// // // // // //           mimeType: "image/jpeg",
// // // // // //         },
// // // // // //       }
// // // // // //     }
// // // // // //     // For local file URIs (like from camera)
// // // // // //     else {
// // // // // //       // Resize and compress the image if needed
// // // // // //       const manipResult = await manipulateAsync(
// // // // // //         imageUri,
// // // // // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // // // // //         { compress: 0.8, format: SaveFormat.JPEG },
// // // // // //       )

// // // // // //       // Read as base64
// // // // // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // // // // //         encoding: FileSystem.EncodingType.Base64,
// // // // // //       })

// // // // // //       return {
// // // // // //         inlineData: {
// // // // // //           data: base64,
// // // // // //           mimeType: "image/jpeg",
// // // // // //         },
// // // // // //       }
// // // // // //     }
// // // // // //   } catch (error) {
// // // // // //     console.error("Error processing image:", error)
// // // // // //     throw new Error("Failed to process image")
// // // // // //   }
// // // // // // }

// // // // // // // Analyze food image using Gemini
// // // // // // export const analyzeFoodImage = async (imageUri: string) => {
// // // // // //   try {
// // // // // //     if (!GOOGLE_API_KEY) {
// // // // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // // // //     }

// // // // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
// // // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // // //     // Convert image to format required by Gemini
// // // // // //     const imagePart = await fileToGenerativePart(imageUri)

// // // // // //     const prompt = `
// // // // // //       Analyze this food image and provide the following information in detail:
// // // // // //       1. What food item(s) are in the image?
// // // // // //       2. Estimate the calories in this meal
// // // // // //       3. Identify any nutritional warnings (high salt, sugar, fat, etc.)
// // // // // //       4. List all ingredients used to make this food
// // // // // //       5. Describe the preparation method
// // // // // //       6. List all nutritional information (protein, carbs, fat, fiber, vitamins, minerals)
// // // // // //       7. Provide health benefits of this food
// // // // // //       8. Suggest any dietary modifications for healthier version
      
// // // // // //       Format your response as a valid JSON object with the following structure:
// // // // // //       {
// // // // // //         "name": "Food name",
// // // // // //         "calories": number,
// // // // // //         "nutritionalWarning": "Warning message or null if none",
// // // // // //         "ingredients": ["ingredient1", "ingredient2", ...],
// // // // // //         "preparationMethod": "Detailed preparation steps",
// // // // // //         "nutritionalInfo": {
// // // // // //           "protein": "amount in grams",
// // // // // //           "carbs": "amount in grams",
// // // // // //           "fat": "amount in grams",
// // // // // //           "fiber": "amount in grams",
// // // // // //           "vitamins": ["vitamin1", "vitamin2", ...],
// // // // // //           "minerals": ["mineral1", "mineral2", ...]
// // // // // //         },
// // // // // //         "healthBenefits": ["benefit1", "benefit2", ...],
// // // // // //         "healthierAlternatives": ["alternative1", "alternative2", ...]
// // // // // //       }
      
// // // // // //       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
// // // // // //     `

// // // // // //     // Generate content
// // // // // //     const result = await model.generateContent([prompt, imagePart])
// // // // // //     const response = await result.response
// // // // // //     const text = response.text().trim()

// // // // // //     // Parse the JSON response with error handling
// // // // // //     let foodAnalysis
// // // // // //     try {
// // // // // //       // Clean the text to ensure it's valid JSON
// // // // // //       // Remove any markdown code block indicators if present
// // // // // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // // // // //       foodAnalysis = JSON.parse(cleanedText)
// // // // // //     } catch (error) {
// // // // // //       console.error("Error parsing JSON response:", error, "Raw response:", text)
// // // // // //       // Fallback if JSON parsing fails
// // // // // //       foodAnalysis = {
// // // // // //         name: "Unknown food item",
// // // // // //         calories: 0,
// // // // // //         nutritionalWarning: "Could not analyze nutritional content",
// // // // // //         ingredients: ["Could not identify ingredients"],
// // // // // //         preparationMethod: "Could not determine preparation method",
// // // // // //         nutritionalInfo: {
// // // // // //           protein: "0g",
// // // // // //           carbs: "0g",
// // // // // //           fat: "0g",
// // // // // //           fiber: "0g",
// // // // // //           vitamins: ["Unknown"],
// // // // // //           minerals: ["Unknown"],
// // // // // //         },
// // // // // //         healthBenefits: ["Could not determine health benefits"],
// // // // // //         healthierAlternatives: ["Could not suggest alternatives"],
// // // // // //       }
// // // // // //     }

// // // // // //     // Add current time
// // // // // //     const now = new Date()
// // // // // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // // // // //     return {
// // // // // //       id: Date.now().toString(),
// // // // // //       name: foodAnalysis.name || "Unknown food",
// // // // // //       calories: foodAnalysis.calories || 0,
// // // // // //       nutritionalWarning: foodAnalysis.nutritionalWarning || null,
// // // // // //       ingredients: foodAnalysis.ingredients || ["Unknown"],
// // // // // //       preparationMethod: foodAnalysis.preparationMethod || "Unknown",
// // // // // //       nutritionalInfo: foodAnalysis.nutritionalInfo || {
// // // // // //         protein: "0g",
// // // // // //         carbs: "0g",
// // // // // //         fat: "0g",
// // // // // //         fiber: "0g",
// // // // // //         vitamins: ["Unknown"],
// // // // // //         minerals: ["Unknown"],
// // // // // //       },
// // // // // //       healthBenefits: foodAnalysis.healthBenefits || ["Unknown"],
// // // // // //       healthierAlternatives: foodAnalysis.healthierAlternatives || ["Unknown"],
// // // // // //       time: timeString,
// // // // // //       imageUrl: imageUri,
// // // // // //     }
// // // // // //   } catch (error) {
// // // // // //     console.error("Error analyzing food image:", error)
// // // // // //     // Return a fallback response instead of throwing
// // // // // //     const now = new Date()
// // // // // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // // // // //     return {
// // // // // //       id: Date.now().toString(),
// // // // // //       name: "Food item (analysis failed)",
// // // // // //       calories: 0,
// // // // // //       nutritionalWarning: "Could not analyze nutritional content",
// // // // // //       ingredients: ["Could not identify ingredients"],
// // // // // //       preparationMethod: "Could not determine preparation method",
// // // // // //       nutritionalInfo: {
// // // // // //         protein: "0g",
// // // // // //         carbs: "0g",
// // // // // //         fat: "0g",
// // // // // //         fiber: "0g",
// // // // // //         vitamins: ["Unknown"],
// // // // // //         minerals: ["Unknown"],
// // // // // //       },
// // // // // //       healthBenefits: ["Could not determine health benefits"],
// // // // // //       healthierAlternatives: ["Could not suggest alternatives"],
// // // // // //       time: timeString,
// // // // // //       imageUrl: imageUri,
// // // // // //     }
// // // // // //   }
// // // // // // }

// // // // // // // Translate text using Gemini
// // // // // // export const translateText = async (text: string, targetLanguage: string) => {
// // // // // //   try {
// // // // // //     if (!GOOGLE_API_KEY) {
// // // // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // // // //     }

// // // // // //     // Access the model
// // // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // // //     const prompt = `
// // // // // //       Translate the following text to ${targetLanguage}:
      
// // // // // //       "${text}"
      
// // // // // //       Provide only the translated text without any additional explanations or quotation marks.
// // // // // //     `

// // // // // //     // Generate content
// // // // // //     const result = await model.generateContent(prompt)
// // // // // //     const response = await result.response
// // // // // //     return response.text().trim()
// // // // // //   } catch (error) {
// // // // // //     console.error("Error translating text:", error)
// // // // // //     return text // Return original text if translation fails
// // // // // //   }
// // // // // // }

// // // // // // // Get AI suggestions based on health and food data
// // // // // // export const getAiSuggestions = async (healthData: any, foodData: any) => {
// // // // // //   try {
// // // // // //     if (!GOOGLE_API_KEY) {
// // // // // //       return "Add your Gemini API key to get personalized health suggestions based on your data."
// // // // // //     }

// // // // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro
// // // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // // //     const prompt = `
// // // // // //       Based on the following health and food data, provide personalized suggestions for an elderly person:
      
// // // // // //       Health Data: ${JSON.stringify(healthData)}
// // // // // //       Food Data: ${JSON.stringify(foodData)}
      
// // // // // //       Provide suggestions for:
// // // // // //       1. Physical activities appropriate for elderly
// // // // // //       2. Dietary recommendations
// // // // // //       3. Health monitoring tips
      
// // // // // //       Keep your response concise, friendly, and easy to understand for an elderly person. 
// // // // // //       Use simple language and focus on practical advice.
// // // // // //       Limit your response to 3-4 sentences.
// // // // // //     `

// // // // // //     // Generate content
// // // // // //     const result = await model.generateContent(prompt)
// // // // // //     const response = await result.response
// // // // // //     return response.text()
// // // // // //   } catch (error) {
// // // // // //     console.error("Error getting AI suggestions:", error)
// // // // // //     return "Try taking a 15-minute walk today and stay hydrated. Include more colorful vegetables in your meals and consider reducing salt intake. Remember to measure your blood pressure regularly and take medications as prescribed."
// // // // // //   }
// // // // // // }

// // // // // // // Enhance object detection description for blind users
// // // // // // export const enhanceObjectDescription = async (detectedObjects: any[]) => {
// // // // // //   try {
// // // // // //     if (!GOOGLE_API_KEY) {
// // // // // //       return "Object detection complete, but enhanced descriptions require a Gemini API key."
// // // // // //     }

// // // // // //     // Access the model
// // // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // // //     const prompt = `
// // // // // //       I'm creating an app for blind users that detects objects using a smartphone camera.
// // // // // //       I've detected the following objects:
      
// // // // // //       ${JSON.stringify(detectedObjects)}
      
// // // // // //       Please create a helpful, conversational description that:
// // // // // //       1. Summarizes what objects are present and their approximate locations relative to each other
// // // // // //       2. Mentions any potential hazards or obstacles
// // // // // //       3. Provides context about the environment based on the objects detected
// // // // // //       4. Suggests any relevant actions the user might want to take
      
// // // // // //       Make the description clear, concise, and optimized for text-to-speech.
// // // // // //       Use natural, conversational language as if you're speaking to a blind person.
// // // // // //       Avoid technical terms and focus on practical information.
// // // // // //       Keep the description under 5 sentences for clarity.
// // // // // //     `

// // // // // //     // Generate content
// // // // // //     const result = await model.generateContent(prompt)
// // // // // //     const response = await result.response
// // // // // //     return response.text().trim()
// // // // // //   } catch (error) {
// // // // // //     console.error("Error enhancing object description:", error)

// // // // // //     // Create a basic description as fallback
// // // // // //     const objectNames = detectedObjects.map((obj) => obj.name).join(", ")
// // // // // //     return `I detected the following objects: ${objectNames}. Please be aware of your surroundings.`
// // // // // //   }
// // // // // // }

// // // // // import { GoogleGenerativeAI } from "@google/generative-ai"
// // // // // import * as FileSystem from "expo-file-system"
// // // // // import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
// // // // // import Constants from "expo-constants"

// // // // // // Initialize the Google Generative AI with your API key
// // // // // const GOOGLE_API_KEY =
// // // // //   Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
// // // // // const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// // // // // // Convert an image to base64 for Gemini API
// // // // // async function fileToGenerativePart(imageUri: string) {
// // // // //   try {
// // // // //     // For remote URLs, fetch and encode
// // // // //     if (imageUri.startsWith("http")) {
// // // // //       // Download the image to a local file
// // // // //       const fileUri = FileSystem.cacheDirectory + "temp_image.jpg"
// // // // //       await FileSystem.downloadAsync(imageUri, fileUri)

// // // // //       // Resize and compress the image if needed (to reduce size)
// // // // //       const manipResult = await manipulateAsync(
// // // // //         fileUri,
// // // // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // // // //         { compress: 0.8, format: SaveFormat.JPEG },
// // // // //       )

// // // // //       // Read as base64
// // // // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // // // //         encoding: FileSystem.EncodingType.Base64,
// // // // //       })

// // // // //       return {
// // // // //         inlineData: {
// // // // //           data: base64,
// // // // //           mimeType: "image/jpeg",
// // // // //         },
// // // // //       }
// // // // //     }
// // // // //     // For local file URIs (like from camera)
// // // // //     else {
// // // // //       // Resize and compress the image if needed
// // // // //       const manipResult = await manipulateAsync(
// // // // //         imageUri,
// // // // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // // // //         { compress: 0.8, format: SaveFormat.JPEG },
// // // // //       )

// // // // //       // Read as base64
// // // // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // // // //         encoding: FileSystem.EncodingType.Base64,
// // // // //       })

// // // // //       return {
// // // // //         inlineData: {
// // // // //           data: base64,
// // // // //           mimeType: "image/jpeg",
// // // // //         },
// // // // //       }
// // // // //     }
// // // // //   } catch (error) {
// // // // //     console.error("Error processing image:", error)
// // // // //     throw new Error("Failed to process image")
// // // // //   }
// // // // // }

// // // // // // Analyze food image using Gemini
// // // // // export const analyzeFoodImage = async (imageUri: string) => {
// // // // //   try {
// // // // //     if (!GOOGLE_API_KEY) {
// // // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // // //     }

// // // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
// // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // //     // Convert image to format required by Gemini
// // // // //     const imagePart = await fileToGenerativePart(imageUri)

// // // // //     const prompt = `
// // // // //       Analyze this food image and provide the following information in detail:
// // // // //       1. What food item(s) are in the image?
// // // // //       2. Estimate the calories in this meal
// // // // //       3. Identify any nutritional warnings (high salt, sugar, fat, etc.)
// // // // //       4. List all ingredients used to make this food
// // // // //       5. Describe the preparation method
// // // // //       6. List all nutritional information (protein, carbs, fat, fiber, vitamins, minerals)
// // // // //       7. Provide health benefits of this food
// // // // //       8. Suggest any dietary modifications for healthier version
      
// // // // //       Format your response as a valid JSON object with the following structure:
// // // // //       {
// // // // //         "name": "Food name",
// // // // //         "calories": number,
// // // // //         "nutritionalWarning": "Warning message or null if none",
// // // // //         "ingredients": ["ingredient1", "ingredient2", ...],
// // // // //         "preparationMethod": "Detailed preparation steps",
// // // // //         "nutritionalInfo": {
// // // // //           "protein": "amount in grams",
// // // // //           "carbs": "amount in grams",
// // // // //           "fat": "amount in grams",
// // // // //           "fiber": "amount in grams",
// // // // //           "vitamins": ["vitamin1", "vitamin2", ...],
// // // // //           "minerals": ["mineral1", "mineral2", ...]
// // // // //         },
// // // // //         "healthBenefits": ["benefit1", "benefit2", ...],
// // // // //         "healthierAlternatives": ["alternative1", "alternative2", ...]
// // // // //       }
      
// // // // //       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
// // // // //     `

// // // // //     // Generate content
// // // // //     const result = await model.generateContent([prompt, imagePart])
// // // // //     const response = await result.response
// // // // //     const text = response.text().trim()

// // // // //     // Parse the JSON response with error handling
// // // // //     let foodAnalysis
// // // // //     try {
// // // // //       // Clean the text to ensure it's valid JSON
// // // // //       // Remove any markdown code block indicators if present
// // // // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // // // //       foodAnalysis = JSON.parse(cleanedText)
// // // // //     } catch (error) {
// // // // //       console.error("Error parsing JSON response:", error, "Raw response:", text)
// // // // //       // Fallback if JSON parsing fails
// // // // //       foodAnalysis = {
// // // // //         name: "Unknown food item",
// // // // //         calories: 0,
// // // // //         nutritionalWarning: "Could not analyze nutritional content",
// // // // //         ingredients: ["Could not identify ingredients"],
// // // // //         preparationMethod: "Could not determine preparation method",
// // // // //         nutritionalInfo: {
// // // // //           protein: "0g",
// // // // //           carbs: "0g",
// // // // //           fat: "0g",
// // // // //           fiber: "0g",
// // // // //           vitamins: ["Unknown"],
// // // // //           minerals: ["Unknown"],
// // // // //         },
// // // // //         healthBenefits: ["Could not determine health benefits"],
// // // // //         healthierAlternatives: ["Could not suggest alternatives"],
// // // // //       }
// // // // //     }

// // // // //     // Add current time
// // // // //     const now = new Date()
// // // // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // // // //     return {
// // // // //       id: Date.now().toString(),
// // // // //       name: foodAnalysis.name || "Unknown food",
// // // // //       calories: foodAnalysis.calories || 0,
// // // // //       nutritionalWarning: foodAnalysis.nutritionalWarning || null,
// // // // //       ingredients: foodAnalysis.ingredients || ["Unknown"],
// // // // //       preparationMethod: foodAnalysis.preparationMethod || "Unknown",
// // // // //       nutritionalInfo: foodAnalysis.nutritionalInfo || {
// // // // //         protein: "0g",
// // // // //         carbs: "0g",
// // // // //         fat: "0g",
// // // // //         fiber: "0g",
// // // // //         vitamins: ["Unknown"],
// // // // //         minerals: ["Unknown"],
// // // // //       },
// // // // //       healthBenefits: foodAnalysis.healthBenefits || ["Unknown"],
// // // // //       healthierAlternatives: foodAnalysis.healthierAlternatives || ["Unknown"],
// // // // //       time: timeString,
// // // // //       imageUrl: imageUri,
// // // // //     }
// // // // //   } catch (error) {
// // // // //     console.error("Error analyzing food image:", error)
// // // // //     // Return a fallback response instead of throwing
// // // // //     const now = new Date()
// // // // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // // // //     return {
// // // // //       id: Date.now().toString(),
// // // // //       name: "Food item (analysis failed)",
// // // // //       calories: 0,
// // // // //       nutritionalWarning: "Could not analyze nutritional content",
// // // // //       ingredients: ["Could not identify ingredients"],
// // // // //       preparationMethod: "Could not determine preparation method",
// // // // //       nutritionalInfo: {
// // // // //         protein: "0g",
// // // // //         carbs: "0g",
// // // // //         fat: "0g",
// // // // //         fiber: "0g",
// // // // //         vitamins: ["Unknown"],
// // // // //         minerals: ["Unknown"],
// // // // //       },
// // // // //       healthBenefits: ["Could not determine health benefits"],
// // // // //       healthierAlternatives: ["Could not suggest alternatives"],
// // // // //       time: timeString,
// // // // //       imageUrl: imageUri,
// // // // //     }
// // // // //   }
// // // // // }

// // // // // // Translate text using Gemini
// // // // // export const translateText = async (text: string, targetLanguage: string) => {
// // // // //   try {
// // // // //     if (!GOOGLE_API_KEY) {
// // // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // // //     }

// // // // //     // Access the model
// // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // //     const prompt = `
// // // // //       Translate the following text to ${targetLanguage}:
      
// // // // //       "${text}"
      
// // // // //       Provide only the translated text without any additional explanations or quotation marks.
// // // // //     `

// // // // //     // Generate content
// // // // //     const result = await model.generateContent(prompt)
// // // // //     const response = await result.response
// // // // //     return response.text().trim()
// // // // //   } catch (error) {
// // // // //     console.error("Error translating text:", error)
// // // // //     return text // Return original text if translation fails
// // // // //   }
// // // // // }

// // // // // // Get AI suggestions based on health and food data
// // // // // export const getAiSuggestions = async (healthData: any, foodData: any) => {
// // // // //   try {
// // // // //     if (!GOOGLE_API_KEY) {
// // // // //       return "Add your Gemini API key to get personalized health suggestions based on your data."
// // // // //     }

// // // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro
// // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // //     const prompt = `
// // // // //       Based on the following health and food data, provide personalized suggestions for an elderly person:
      
// // // // //       Health Data: ${JSON.stringify(healthData)}
// // // // //       Food Data: ${JSON.stringify(foodData)}
      
// // // // //       Provide suggestions for:
// // // // //       1. Physical activities appropriate for elderly
// // // // //       2. Dietary recommendations
// // // // //       3. Health monitoring tips
      
// // // // //       Keep your response concise, friendly, and easy to understand for an elderly person. 
// // // // //       Use simple language and focus on practical advice.
// // // // //       Limit your response to 3-4 sentences.
// // // // //     `

// // // // //     // Generate content
// // // // //     const result = await model.generateContent(prompt)
// // // // //     const response = await result.response
// // // // //     return response.text()
// // // // //   } catch (error) {
// // // // //     console.error("Error getting AI suggestions:", error)
// // // // //     return "Try taking a 15-minute walk today and stay hydrated. Include more colorful vegetables in your meals and consider reducing salt intake. Remember to measure your blood pressure regularly and take medications as prescribed."
// // // // //   }
// // // // // }

// // // // // // Analyze image for object detection using Gemini
// // // // // export const analyzeImageForObjects = async (imageUri: string) => {
// // // // //   try {
// // // // //     if (!GOOGLE_API_KEY) {
// // // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // // //     }

// // // // //     // Access the model
// // // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // // //     // Convert image to format required by Gemini
// // // // //     const imagePart = await fileToGenerativePart(imageUri)

// // // // //     const prompt = `
// // // // //       I'm creating an app for blind users that detects objects using a smartphone camera.
// // // // //       Analyze this image and identify all objects present.
      
// // // // //       For each object, provide:
// // // // //       1. The name of the object
// // // // //       2. The approximate position in the image (e.g., "center", "top left", "bottom right")
// // // // //       3. Any potential hazards or obstacles
      
// // // // //       Also provide a helpful, conversational description that:
// // // // //       1. Summarizes what objects are present and their approximate locations relative to each other
// // // // //       2. Mentions any potential hazards or obstacles
// // // // //       3. Provides context about the environment based on the objects detected
// // // // //       4. Suggests any relevant actions the user might want to take
      
// // // // //       Format your response as a valid JSON object with the following structure:
// // // // //       {
// // // // //         "objects": [
// // // // //           {
// // // // //             "name": "object name",
// // // // //             "position": "position in image",
// // // // //             "isHazard": boolean
// // // // //           },
// // // // //           ...
// // // // //         ],
// // // // //         "description": "A natural, conversational description optimized for text-to-speech for a blind user"
// // // // //       }
      
// // // // //       Make the description clear, concise, and optimized for text-to-speech.
// // // // //       Use natural, conversational language as if you're speaking to a blind person.
// // // // //       Avoid technical terms and focus on practical information.
// // // // //       Keep the description under 5 sentences for clarity.
// // // // //     `

// // // // //     // Generate content
// // // // //     const result = await model.generateContent([prompt, imagePart])
// // // // //     const response = await result.response
// // // // //     const text = response.text().trim()

// // // // //     // Parse the JSON response with error handling
// // // // //     try {
// // // // //       // Clean the text to ensure it's valid JSON
// // // // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // // // //       return JSON.parse(cleanedText)
// // // // //     } catch (error) {
// // // // //       console.error("Error parsing JSON response:", error, "Raw response:", text)

// // // // //       // Try to extract a description from the text if JSON parsing fails
// // // // //       let description =
// // // // //         "I can see an image, but I'm having trouble identifying specific objects. Please try again with a clearer photo or different lighting."

// // // // //       if (text.includes("description")) {
// // // // //         const descriptionMatch = text.match(/"description"\s*:\s*"([^"]+)"/)
// // // // //         if (descriptionMatch && descriptionMatch[1]) {
// // // // //           description = descriptionMatch[1]
// // // // //         }
// // // // //       }

// // // // //       // Return a basic structure
// // // // //       return {
// // // // //         objects: [],
// // // // //         description: description,
// // // // //       }
// // // // //     }
// // // // //   } catch (error) {
// // // // //     console.error("Error analyzing image for objects:", error)
// // // // //     return {
// // // // //       objects: [],
// // // // //       description:
// // // // //         "I encountered an error while analyzing this image. Please try again or check your internet connection.",
// // // // //     }
// // // // //   }
// // // // // }







// // // // import { GoogleGenerativeAI } from "@google/generative-ai"
// // // // import * as FileSystem from "expo-file-system"
// // // // import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
// // // // import Constants from "expo-constants"

// // // // // Initialize the Google Generative AI with your API key
// // // // const GOOGLE_API_KEY =
// // // //   Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
// // // // const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// // // // // Convert an image to base64 for Gemini API
// // // // async function fileToGenerativePart(imageUri: string) {
// // // //   try {
// // // //     // For remote URLs, fetch and encode
// // // //     if (imageUri.startsWith("http")) {
// // // //       // Download the image to a local file
// // // //       const fileUri = FileSystem.cacheDirectory + "temp_image.jpg"
// // // //       await FileSystem.downloadAsync(imageUri, fileUri)

// // // //       // Resize and compress the image if needed (to reduce size)
// // // //       const manipResult = await manipulateAsync(
// // // //         fileUri,
// // // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // // //         { compress: 0.8, format: SaveFormat.JPEG },
// // // //       )

// // // //       // Read as base64
// // // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // // //         encoding: FileSystem.EncodingType.Base64,
// // // //       })

// // // //       return {
// // // //         inlineData: {
// // // //           data: base64,
// // // //           mimeType: "image/jpeg",
// // // //         },
// // // //       }
// // // //     }
// // // //     // For local file URIs (like from camera)
// // // //     else {
// // // //       // Resize and compress the image if needed
// // // //       const manipResult = await manipulateAsync(
// // // //         imageUri,
// // // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // // //         { compress: 0.8, format: SaveFormat.JPEG },
// // // //       )

// // // //       // Read as base64
// // // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // // //         encoding: FileSystem.EncodingType.Base64,
// // // //       })

// // // //       return {
// // // //         inlineData: {
// // // //           data: base64,
// // // //           mimeType: "image/jpeg",
// // // //         },
// // // //       }
// // // //     }
// // // //   } catch (error) {
// // // //     console.error("Error processing image:", error)
// // // //     throw new Error("Failed to process image")
// // // //   }
// // // // }

// // // // // Analyze food image using Gemini
// // // // export const analyzeFoodImage = async (imageUri: string) => {
// // // //   try {
// // // //     if (!GOOGLE_API_KEY) {
// // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // //     }

// // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
// // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // //     // Convert image to format required by Gemini
// // // //     const imagePart = await fileToGenerativePart(imageUri)

// // // //     const prompt = `
// // // //       Analyze this food image and provide the following information in detail:
// // // //       1. What food item(s) are in the image?
// // // //       2. Estimate the calories in this meal
// // // //       3. Identify any nutritional warnings (high salt, sugar, fat, etc.)
// // // //       4. List all ingredients used to make this food
// // // //       5. Describe the preparation method
// // // //       6. List all nutritional information (protein, carbs, fat, fiber, vitamins, minerals)
// // // //       7. Provide health benefits of this food
// // // //       8. Suggest any dietary modifications for healthier version
      
// // // //       Format your response as a valid JSON object with the following structure:
// // // //       {
// // // //         "name": "Food name",
// // // //         "calories": number,
// // // //         "nutritionalWarning": "Warning message or null if none",
// // // //         "ingredients": ["ingredient1", "ingredient2", ...],
// // // //         "preparationMethod": "Detailed preparation steps",
// // // //         "nutritionalInfo": {
// // // //           "protein": "amount in grams",
// // // //           "carbs": "amount in grams",
// // // //           "fat": "amount in grams",
// // // //           "fiber": "amount in grams",
// // // //           "vitamins": ["vitamin1", "vitamin2", ...],
// // // //           "minerals": ["mineral1", "mineral2", ...]
// // // //         },
// // // //         "healthBenefits": ["benefit1", "benefit2", ...],
// // // //         "healthierAlternatives": ["alternative1", "alternative2", ...]
// // // //       }
      
// // // //       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
// // // //     `

// // // //     // Generate content
// // // //     const result = await model.generateContent([prompt, imagePart])
// // // //     const response = await result.response
// // // //     const text = response.text().trim()

// // // //     // Parse the JSON response with error handling
// // // //     let foodAnalysis
// // // //     try {
// // // //       // Clean the text to ensure it's valid JSON
// // // //       // Remove any markdown code block indicators if present
// // // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // // //       foodAnalysis = JSON.parse(cleanedText)
// // // //     } catch (error) {
// // // //       console.error("Error parsing JSON response:", error, "Raw response:", text)
// // // //       // Fallback if JSON parsing fails
// // // //       foodAnalysis = {
// // // //         name: "Unknown food item",
// // // //         calories: 0,
// // // //         nutritionalWarning: "Could not analyze nutritional content",
// // // //         ingredients: ["Could not identify ingredients"],
// // // //         preparationMethod: "Could not determine preparation method",
// // // //         nutritionalInfo: {
// // // //           protein: "0g",
// // // //           carbs: "0g",
// // // //           fat: "0g",
// // // //           fiber: "0g",
// // // //           vitamins: ["Unknown"],
// // // //           minerals: ["Unknown"],
// // // //         },
// // // //         healthBenefits: ["Could not determine health benefits"],
// // // //         healthierAlternatives: ["Could not suggest alternatives"],
// // // //       }
// // // //     }

// // // //     // Add current time
// // // //     const now = new Date()
// // // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // // //     return {
// // // //       id: Date.now().toString(),
// // // //       name: foodAnalysis.name || "Unknown food",
// // // //       calories: foodAnalysis.calories || 0,
// // // //       nutritionalWarning: foodAnalysis.nutritionalWarning || null,
// // // //       ingredients: foodAnalysis.ingredients || ["Unknown"],
// // // //       preparationMethod: foodAnalysis.preparationMethod || "Unknown",
// // // //       nutritionalInfo: foodAnalysis.nutritionalInfo || {
// // // //         protein: "0g",
// // // //         carbs: "0g",
// // // //         fat: "0g",
// // // //         fiber: "0g",
// // // //         vitamins: ["Unknown"],
// // // //         minerals: ["Unknown"],
// // // //       },
// // // //       healthBenefits: foodAnalysis.healthBenefits || ["Unknown"],
// // // //       healthierAlternatives: foodAnalysis.healthierAlternatives || ["Unknown"],
// // // //       time: timeString,
// // // //       imageUrl: imageUri,
// // // //     }
// // // //   } catch (error) {
// // // //     console.error("Error analyzing food image:", error)
// // // //     // Return a fallback response instead of throwing
// // // //     const now = new Date()
// // // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // // //     return {
// // // //       id: Date.now().toString(),
// // // //       name: "Food item (analysis failed)",
// // // //       calories: 0,
// // // //       nutritionalWarning: "Could not analyze nutritional content",
// // // //       ingredients: ["Could not identify ingredients"],
// // // //       preparationMethod: "Could not determine preparation method",
// // // //       nutritionalInfo: {
// // // //         protein: "0g",
// // // //         carbs: "0g",
// // // //         fat: "0g",
// // // //         fiber: "0g",
// // // //         vitamins: ["Unknown"],
// // // //         minerals: ["Unknown"],
// // // //       },
// // // //       healthBenefits: ["Could not determine health benefits"],
// // // //       healthierAlternatives: ["Could not suggest alternatives"],
// // // //       time: timeString,
// // // //       imageUrl: imageUri,
// // // //     }
// // // //   }
// // // // }

// // // // // Translate text using Gemini
// // // // export const translateText = async (text: string, targetLanguage: string) => {
// // // //   try {
// // // //     if (!GOOGLE_API_KEY) {
// // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // //     }

// // // //     // Access the model
// // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // //     const prompt = `
// // // //       Translate the following text to ${targetLanguage}:
      
// // // //       "${text}"
      
// // // //       Provide only the translated text without any additional explanations or quotation marks.
// // // //     `

// // // //     // Generate content
// // // //     const result = await model.generateContent(prompt)
// // // //     const response = await result.response
// // // //     return response.text().trim()
// // // //   } catch (error) {
// // // //     console.error("Error translating text:", error)
// // // //     return text // Return original text if translation fails
// // // //   }
// // // // }

// // // // // Get AI suggestions based on health and food data
// // // // export const getAiSuggestions = async (healthData: any, foodData: any) => {
// // // //   try {
// // // //     if (!GOOGLE_API_KEY) {
// // // //       return "Add your Gemini API key to get personalized health suggestions based on your data."
// // // //     }

// // // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro
// // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // //     const prompt = `
// // // //       Based on the following health and food data, provide personalized suggestions for an elderly person:
      
// // // //       Health Data: ${JSON.stringify(healthData)}
// // // //       Food Data: ${JSON.stringify(foodData)}
      
// // // //       Provide suggestions for:
// // // //       1. Physical activities appropriate for elderly
// // // //       2. Dietary recommendations
// // // //       3. Health monitoring tips
      
// // // //       Keep your response concise, friendly, and easy to understand for an elderly person. 
// // // //       Use simple language and focus on practical advice.
// // // //       Limit your response to 3-4 sentences.
// // // //     `

// // // //     // Generate content
// // // //     const result = await model.generateContent(prompt)
// // // //     const response = await result.response
// // // //     return response.text()
// // // //   } catch (error) {
// // // //     console.error("Error getting AI suggestions:", error)
// // // //     return "Try taking a 15-minute walk today and stay hydrated. Include more colorful vegetables in your meals and consider reducing salt intake. Remember to measure your blood pressure regularly and take medications as prescribed."
// // // //   }
// // // // }

// // // // // Analyze image for object detection using Gemini
// // // // export const analyzeImageForObjects = async (imageUri: string) => {
// // // //   try {
// // // //     if (!GOOGLE_API_KEY) {
// // // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // // //     }

// // // //     // Access the model
// // // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // // //     // Convert image to format required by Gemini
// // // //     const imagePart = await fileToGenerativePart(imageUri)

// // // //     const prompt = `
// // // //       I'm creating an app for blind users that detects objects using a smartphone camera.
// // // //       Analyze this image and identify all objects present.
      
// // // //       For each object, provide:
// // // //       1. The name of the object
// // // //       2. The approximate position in the image (e.g., "center", "top left", "bottom right")
// // // //       3. Any potential hazards or obstacles
      
// // // //       Also provide a helpful, conversational description that:
// // // //       1. Summarizes what objects are present and their approximate locations relative to each other
// // // //       2. Mentions any potential hazards or obstacles
// // // //       3. Provides context about the environment based on the objects detected
// // // //       4. Suggests any relevant actions the user might want to take
      
// // // //       Format your response as a valid JSON object with the following structure:
// // // //       {
// // // //         "objects": [
// // // //           {
// // // //             "name": "object name",
// // // //             "position": "position in image",
// // // //             "isHazard": boolean
// // // //           },
// // // //           ...
// // // //         ],
// // // //         "description": "A natural, conversational description optimized for text-to-speech for a blind user"
// // // //       }
      
// // // //       Make the description clear, concise, and optimized for text-to-speech.
// // // //       Use natural, conversational language as if you're speaking to a blind person.
// // // //       Avoid technical terms and focus on practical information.
// // // //       Keep the description under 5 sentences for clarity.
// // // //     `

// // // //     // Generate content
// // // //     const result = await model.generateContent([prompt, imagePart])
// // // //     const response = await result.response
// // // //     const text = response.text().trim()

// // // //     // Parse the JSON response with error handling
// // // //     try {
// // // //       // Clean the text to ensure it's valid JSON
// // // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // // //       return JSON.parse(cleanedText)
// // // //     } catch (error) {
// // // //       console.error("Error parsing JSON response:", error, "Raw response:", text)

// // // //       // Try to extract a description from the text if JSON parsing fails
// // // //       let description =
// // // //         "I can see an image, but I'm having trouble identifying specific objects. Please try again with a clearer photo or different lighting."

// // // //       if (text.includes("description")) {
// // // //         const descriptionMatch = text.match(/"description"\s*:\s*"([^"]+)"/)
// // // //         if (descriptionMatch && descriptionMatch[1]) {
// // // //           description = descriptionMatch[1]
// // // //         }
// // // //       }

// // // //       // Return a basic structure
// // // //       return {
// // // //         objects: [],
// // // //         description: description,
// // // //       }
// // // //     }
// // // //   } catch (error) {
// // // //     console.error("Error analyzing image for objects:", error)
// // // //     return {
// // // //       objects: [],
// // // //       description:
// // // //         "I encountered an error while analyzing this image. Please try again or check your internet connection.",
// // // //     }
// // // //   }
// // // // }









// // // import { GoogleGenerativeAI } from "@google/generative-ai"
// // // import * as FileSystem from "expo-file-system"
// // // import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
// // // import Constants from "expo-constants"

// // // // Initialize the Google Generative AI with your API key
// // // const GOOGLE_API_KEY =
// // //   Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
// // // const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// // // // Convert an image to base64 for Gemini API
// // // async function fileToGenerativePart(imageUri: string) {
// // //   try {
// // //     // For remote URLs, fetch and encode
// // //     if (imageUri.startsWith("http")) {
// // //       // Download the image to a local file
// // //       const fileUri = FileSystem.cacheDirectory + "temp_image.jpg"
// // //       await FileSystem.downloadAsync(imageUri, fileUri)

// // //       // Resize and compress the image if needed (to reduce size)
// // //       const manipResult = await manipulateAsync(
// // //         fileUri,
// // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // //         { compress: 0.8, format: SaveFormat.JPEG },
// // //       )

// // //       // Read as base64
// // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // //         encoding: FileSystem.EncodingType.Base64,
// // //       })

// // //       return {
// // //         inlineData: {
// // //           data: base64,
// // //           mimeType: "image/jpeg",
// // //         },
// // //       }
// // //     }
// // //     // For local file URIs (like from camera)
// // //     else {
// // //       // Resize and compress the image if needed
// // //       const manipResult = await manipulateAsync(
// // //         imageUri,
// // //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// // //         { compress: 0.8, format: SaveFormat.JPEG },
// // //       )

// // //       // Read as base64
// // //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// // //         encoding: FileSystem.EncodingType.Base64,
// // //       })

// // //       return {
// // //         inlineData: {
// // //           data: base64,
// // //           mimeType: "image/jpeg",
// // //         },
// // //       }
// // //     }
// // //   } catch (error) {
// // //     console.error("Error processing image:", error)
// // //     throw new Error("Failed to process image")
// // //   }
// // // }

// // // // Analyze food image using Gemini
// // // export const analyzeFoodImage = async (imageUri: string) => {
// // //   try {
// // //     if (!GOOGLE_API_KEY) {
// // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // //     }

// // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
// // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // //     // Convert image to format required by Gemini
// // //     const imagePart = await fileToGenerativePart(imageUri)

// // //     const prompt = `
// // //       Analyze this food image and provide the following information in detail:
// // //       1. What food item(s) are in the image?
// // //       2. Estimate the calories in this meal
// // //       3. Identify any nutritional warnings (high salt, sugar, fat, etc.)
// // //       4. List all ingredients used to make this food
// // //       5. Describe the preparation method
// // //       6. List all nutritional information (protein, carbs, fat, fiber, vitamins, minerals)
// // //       7. Provide health benefits of this food
// // //       8. Suggest any dietary modifications for healthier version
      
// // //       Format your response as a valid JSON object with the following structure:
// // //       {
// // //         "name": "Food name",
// // //         "calories": number,
// // //         "nutritionalWarning": "Warning message or null if none",
// // //         "ingredients": ["ingredient1", "ingredient2", ...],
// // //         "preparationMethod": "Detailed preparation steps",
// // //         "nutritionalInfo": {
// // //           "protein": "amount in grams",
// // //           "carbs": "amount in grams",
// // //           "fat": "amount in grams",
// // //           "fiber": "amount in grams",
// // //           "vitamins": ["vitamin1", "vitamin2", ...],
// // //           "minerals": ["mineral1", "mineral2", ...]
// // //         },
// // //         "healthBenefits": ["benefit1", "benefit2", ...],
// // //         "healthierAlternatives": ["alternative1", "alternative2", ...]
// // //       }
      
// // //       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
// // //     `

// // //     // Generate content
// // //     const result = await model.generateContent([prompt, imagePart])
// // //     const response = await result.response
// // //     const text = response.text().trim()

// // //     // Parse the JSON response with error handling
// // //     let foodAnalysis
// // //     try {
// // //       // Clean the text to ensure it's valid JSON
// // //       // Remove any markdown code block indicators if present
// // //       const cleanedText = text.replace(/```json|```/g, "").trim()
// // //       foodAnalysis = JSON.parse(cleanedText)
// // //     } catch (error) {
// // //       console.error("Error parsing JSON response:", error, "Raw response:", text)
// // //       // Fallback if JSON parsing fails
// // //       foodAnalysis = {
// // //         name: "Unknown food item",
// // //         calories: 0,
// // //         nutritionalWarning: "Could not analyze nutritional content",
// // //         ingredients: ["Could not identify ingredients"],
// // //         preparationMethod: "Could not determine preparation method",
// // //         nutritionalInfo: {
// // //           protein: "0g",
// // //           carbs: "0g",
// // //           fat: "0g",
// // //           fiber: "0g",
// // //           vitamins: ["Unknown"],
// // //           minerals: ["Unknown"],
// // //         },
// // //         healthBenefits: ["Could not determine health benefits"],
// // //         healthierAlternatives: ["Could not suggest alternatives"],
// // //       }
// // //     }

// // //     // Add current time
// // //     const now = new Date()
// // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // //     return {
// // //       id: Date.now().toString(),
// // //       name: foodAnalysis.name || "Unknown food",
// // //       calories: foodAnalysis.calories || 0,
// // //       nutritionalWarning: foodAnalysis.nutritionalWarning || null,
// // //       ingredients: foodAnalysis.ingredients || ["Unknown"],
// // //       preparationMethod: foodAnalysis.preparationMethod || "Unknown",
// // //       nutritionalInfo: foodAnalysis.nutritionalInfo || {
// // //         protein: "0g",
// // //         carbs: "0g",
// // //         fat: "0g",
// // //         fiber: "0g",
// // //         vitamins: ["Unknown"],
// // //         minerals: ["Unknown"],
// // //       },
// // //       healthBenefits: foodAnalysis.healthBenefits || ["Unknown"],
// // //       healthierAlternatives: foodAnalysis.healthierAlternatives || ["Unknown"],
// // //       time: timeString,
// // //       imageUrl: imageUri,
// // //     }
// // //   } catch (error) {
// // //     console.error("Error analyzing food image:", error)
// // //     // Return a fallback response instead of throwing
// // //     const now = new Date()
// // //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// // //     return {
// // //       id: Date.now().toString(),
// // //       name: "Food item (analysis failed)",
// // //       calories: 0,
// // //       nutritionalWarning: "Could not analyze nutritional content",
// // //       ingredients: ["Could not identify ingredients"],
// // //       preparationMethod: "Could not determine preparation method",
// // //       nutritionalInfo: {
// // //         protein: "0g",
// // //         carbs: "0g",
// // //         fat: "0g",
// // //         fiber: "0g",
// // //         vitamins: ["Unknown"],
// // //         minerals: ["Unknown"],
// // //       },
// // //       healthBenefits: ["Could not determine health benefits"],
// // //       healthierAlternatives: ["Could not suggest alternatives"],
// // //       time: timeString,
// // //       imageUrl: imageUri,
// // //     }
// // //   }
// // // }

// // // // Translate text using Gemini
// // // export const translateText = async (text: string, targetLanguage: string) => {
// // //   try {
// // //     if (!GOOGLE_API_KEY) {
// // //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// // //     }

// // //     // Access the model
// // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // //     const prompt = `
// // //       Translate the following text to ${targetLanguage}:
      
// // //       "${text}"
      
// // //       Provide only the translated text without any additional explanations or quotation marks.
// // //     `

// // //     // Generate content
// // //     const result = await model.generateContent(prompt)
// // //     const response = await result.response
// // //     return response.text().trim()
// // //   } catch (error) {
// // //     console.error("Error translating text:", error)
// // //     return text // Return original text if translation fails
// // //   }
// // // }

// // // // Get AI suggestions based on health and food data
// // // export const getAiSuggestions = async (healthData: any, foodData: any) => {
// // //   try {
// // //     if (!GOOGLE_API_KEY) {
// // //       return "Add your Gemini API key to get personalized health suggestions based on your data."
// // //     }

// // //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro
// // //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// // //     const prompt = `
// // //       Based on the following health and food data, provide personalized suggestions for an elderly person:
      
// // //       Health Data: ${JSON.stringify(healthData)}
// // //       Food Data: ${JSON.stringify(foodData)}
      
// // //       Provide suggestions for:
// // //       1. Physical activities appropriate for elderly
// // //       2. Dietary recommendations
// // //       3. Health monitoring tips
      
// // //       Keep your response concise, friendly, and easy to understand for an elderly person. 
// // //       Use simple language and focus on practical advice.
// // //       Limit your response to 3-4 sentences.
// // //     `

// // //     // Generate content
// // //     const result = await model.generateContent(prompt)
// // //     const response = await result.response
// // //     return response.text()
// // //   } catch (error) {
// // //     console.error("Error getting AI suggestions:", error)
// // //     return "Try taking a 15-minute walk today and stay hydrated. Include more colorful vegetables in your meals and consider reducing salt intake. Remember to measure your blood pressure regularly and take medications as prescribed."
// // //   }
// // // }


// // import { GoogleGenerativeAI } from "@google/generative-ai"
// // import * as FileSystem from "expo-file-system"
// // import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
// // import Constants from "expo-constants"

// // // Initialize the Google Generative AI with your API key
// // const GOOGLE_API_KEY =
// //   Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
// // const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// // // Convert an image to base64 for Gemini API
// // async function fileToGenerativePart(imageUri: string) {
// //   try {
// //     // For remote URLs, fetch and encode
// //     if (imageUri.startsWith("http")) {
// //       // Download the image to a local file
// //       const fileUri = FileSystem.cacheDirectory + "temp_image.jpg"
// //       await FileSystem.downloadAsync(imageUri, fileUri)

// //       // Resize and compress the image if needed (to reduce size)
// //       const manipResult = await manipulateAsync(
// //         fileUri,
// //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// //         { compress: 0.8, format: SaveFormat.JPEG },
// //       )

// //       // Read as base64
// //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// //         encoding: FileSystem.EncodingType.Base64,
// //       })

// //       return {
// //         inlineData: {
// //           data: base64,
// //           mimeType: "image/jpeg",
// //         },
// //       }
// //     }
// //     // For local file URIs (like from camera)
// //     else {
// //       // Resize and compress the image if needed
// //       const manipResult = await manipulateAsync(
// //         imageUri,
// //         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
// //         { compress: 0.8, format: SaveFormat.JPEG },
// //       )

// //       // Read as base64
// //       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
// //         encoding: FileSystem.EncodingType.Base64,
// //       })

// //       return {
// //         inlineData: {
// //           data: base64,
// //           mimeType: "image/jpeg",
// //         },
// //       }
// //     }
// //   } catch (error) {
// //     console.error("Error processing image:", error)
// //     throw new Error("Failed to process image")
// //   }
// // }

// // // Analyze food image using Gemini
// // export const analyzeFoodImage = async (imageUri: string) => {
// //   try {
// //     if (!GOOGLE_API_KEY) {
// //       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
// //     }

// //     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
// //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// //     // Convert image to format required by Gemini
// //     const imagePart = await fileToGenerativePart(imageUri)

// //     const prompt = `
// //       Analyze this food image and provide the following information in detail:
// //       1. What food item(s) are in the image?
// //       2. Estimate the calories in this meal
// //       3. Identify any nutritional warnings (high salt, sugar, fat, etc.)
// //       4. List all ingredients used to make this food
// //       5. Describe the preparation method
// //       6. List all nutritional information (protein, carbs, fat, fiber, vitamins, minerals)
// //       7. Provide health benefits of this food
// //       8. Suggest any dietary modifications for healthier version
      
// //       Format your response as a valid JSON object with the following structure:
// //       {
// //         "name": "Food name",
// //         "calories": number,
// //         "nutritionalWarning": "Warning message or null if none",
// //         "ingredients": ["ingredient1", "ingredient2", ...],
// //         "preparationMethod": "Detailed preparation steps",
// //         "nutritionalInfo": {
// //           "protein": "amount in grams",
// //           "carbs": "amount in grams",
// //           "fat": "amount in grams",
// //           "fiber": "amount in grams",
// //           "vitamins": ["vitamin1", "vitamin2", ...],
// //           "minerals": ["mineral1", "mineral2", ...]
// //         },
// //         "healthBenefits": ["benefit1", "benefit2", ...],
// //         "healthierAlternatives": ["alternative1", "alternative2", ...]
// //       }
      
// //       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
// //     `

// //     // Generate content
// //     const result = await model.generateContent([prompt, imagePart])
// //     const response = await result.response
// //     const text = response.text().trim()

// //     // Parse the JSON response with error handling
// //     let foodAnalysis
// //     try {
// //       // Clean the text to ensure it's valid JSON
// //       // Remove any markdown code block indicators if present
// //       const cleanedText = text.replace(/```json|```/g, "").trim()
// //       foodAnalysis = JSON.parse(cleanedText)
// //     } catch (error) {
// //       console.error("Error parsing JSON response:", error, "Raw response:", text)
// //       // Fallback if JSON parsing fails
// //       foodAnalysis = {
// //         name: "Unknown food item",
// //         calories: 0,
// //         nutritionalWarning: "Could not analyze nutritional content",
// //         ingredients: ["Could not identify ingredients"],
// //         preparationMethod: "Could not determine preparation method",
// //         nutritionalInfo: {
// //           protein: "0g",
// //           carbs: "0g",
// //           fat: "0g",
// //           fiber: "0g",
// //           vitamins: ["Unknown"],
// //           minerals: ["Unknown"],
// //         },
// //         healthBenefits: ["Could not determine health benefits"],
// //         healthierAlternatives: ["Could not suggest alternatives"],
// //       }
// //     }

// //     // Add current time
// //     const now = new Date()
// //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// //     return {
// //       id: Date.now().toString(),
// //       name: foodAnalysis.name || "Unknown food",
// //       calories: foodAnalysis.calories || 0,
// //       nutritionalWarning: foodAnalysis.nutritionalWarning || null,
// //       ingredients: foodAnalysis.ingredients || ["Unknown"],
// //       preparationMethod: foodAnalysis.preparationMethod || "Unknown",
// //       nutritionalInfo: foodAnalysis.nutritionalInfo || {
// //         protein: "0g",
// //         carbs: "0g",
// //         fat: "0g",
// //         fiber: "0g",
// //         vitamins: ["Unknown"],
// //         minerals: ["Unknown"],
// //       },
// //       healthBenefits: foodAnalysis.healthBenefits || ["Unknown"],
// //       healthierAlternatives: foodAnalysis.healthierAlternatives || ["Unknown"],
// //       time: timeString,
// //       imageUrl: imageUri,
// //     }
// //   } catch (error) {
// //     console.error("Error analyzing food image:", error)
// //     // Return a fallback response instead of throwing
// //     const now = new Date()
// //     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// //     return {
// //       id: Date.now().toString(),
// //       name: "Food item (analysis failed)",
// //       calories: 0,
// //       nutritionalWarning: "Could not analyze nutritional content",
// //       ingredients: ["Could not identify ingredients"],
// //       preparationMethod: "Could not determine preparation method",
// //       nutritionalInfo: {
// //         protein: "0g",
// //         carbs: "0g",
// //         fat: "0g",
// //         fiber: "0g",
// //         vitamins: ["Unknown"],
// //         minerals: ["Unknown"],
// //       },
// //       healthBenefits: ["Could not determine health benefits"],
// //       healthierAlternatives: ["Could not suggest alternatives"],
// //       time: timeString,
// //       imageUrl: imageUri,
// //     }
// //   }
// // }

// // // Mock Gemini API service for development

// // // Get AI suggestions based on health and food data
// // export const getAiSuggestions = async (healthData: any, foodData: any) => {
// //   // Mock AI suggestions
// //   return `Based on your recent health data and food intake, here are some suggestions:

// // 1. Your blood pressure readings are within normal range, but continue monitoring regularly.

// // 2. Consider increasing your water intake to at least 2 liters per day.

// // 3. Your protein intake is good, but you could benefit from adding more vegetables to your meals.

// // 4. Try to maintain your regular walking routine as it's helping maintain your heart rate at a healthy level.

// // 5. Consider adding more fiber-rich foods to your diet to help manage blood sugar levels.`
// // }

// // // Translate text to selected language
// // export const translateText = async (text: string, language: string) => {
// //   // For development, just return the original text
// //   // In production, this would call the Gemini API for translation
// //   return text
// // }


// import { GoogleGenerativeAI } from "@google/generative-ai"
// import * as FileSystem from "expo-file-system"
// import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
// import Constants from "expo-constants"

// // Initialize the Google Generative AI with your API key
// const GOOGLE_API_KEY =
//   Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
// const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// // Convert an image to base64 for Gemini API
// async function fileToGenerativePart(imageUri: string) {
//   try {
//     // For remote URLs, fetch and encode
//     if (imageUri.startsWith("http")) {
//       // Download the image to a local file
//       const fileUri = FileSystem.cacheDirectory + "temp_image.jpg"
//       await FileSystem.downloadAsync(imageUri, fileUri)

//       // Resize and compress the image if needed (to reduce size)
//       const manipResult = await manipulateAsync(
//         fileUri,
//         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
//         { compress: 0.8, format: SaveFormat.JPEG },
//       )

//       // Read as base64
//       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
//         encoding: FileSystem.EncodingType.Base64,
//       })

//       return {
//         inlineData: {
//           data: base64,
//           mimeType: "image/jpeg",
//         },
//       }
//     }
//     // For local file URIs (like from camera)
//     else {
//       // Resize and compress the image if needed
//       const manipResult = await manipulateAsync(
//         imageUri,
//         [{ resize: { width: 800 } }], // Resize to reasonable dimensions
//         { compress: 0.8, format: SaveFormat.JPEG },
//       )

//       // Read as base64
//       const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
//         encoding: FileSystem.EncodingType.Base64,
//       })

//       return {
//         inlineData: {
//           data: base64,
//           mimeType: "image/jpeg",
//         },
//       }
//     }
//   } catch (error) {
//     console.error("Error processing image:", error)
//     throw new Error("Failed to process image")
//   }
// }

// // Analyze food image using Gemini
// export const analyzeFoodImage = async (imageUri: string) => {
//   try {
//     if (!GOOGLE_API_KEY) {
//       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
//     }

//     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

//     // Convert image to format required by Gemini
//     const imagePart = await fileToGenerativePart(imageUri)

//     const prompt = `
//       Analyze this food image and provide the following information in detail:
//       1. What food item(s) are in the image?
//       2. Estimate the calories in this meal
//       3. Identify any nutritional warnings (high salt, sugar, fat, etc.)
//       4. List all ingredients used to make this food
//       5. Describe the preparation method
//       6. List all nutritional information (protein, carbs, fat, fiber, vitamins, minerals)
//       7. Provide health benefits of this food
//       8. Suggest any dietary modifications for healthier version
      
//       Format your response as a valid JSON object with the following structure:
//       {
//         "name": "Food name",
//         "calories": number,
//         "nutritionalWarning": "Warning message or null if none",
//         "ingredients": ["ingredient1", "ingredient2", ...],
//         "preparationMethod": "Detailed preparation steps",
//         "nutritionalInfo": {
//           "protein": "amount in grams",
//           "carbs": "amount in grams",
//           "fat": "amount in grams",
//           "fiber": "amount in grams",
//           "vitamins": ["vitamin1", "vitamin2", ...],
//           "minerals": ["mineral1", "mineral2", ...]
//         },
//         "healthBenefits": ["benefit1", "benefit2", ...],
//         "healthierAlternatives": ["alternative1", "alternative2", ...]
//       }
      
//       Ensure the response is properly formatted JSON with no trailing commas or extra characters.
//     `

//     // Generate content
//     const result = await model.generateContent([prompt, imagePart])
//     const response = await result.response
//     const text = response.text().trim()

//     // Parse the JSON response with error handling
//     let foodAnalysis
//     try {
//       // Clean the text to ensure it's valid JSON
//       // Remove any markdown code block indicators if present
//       const cleanedText = text.replace(/```json|```/g, "").trim()
//       foodAnalysis = JSON.parse(cleanedText)
//     } catch (error) {
//       console.error("Error parsing JSON response:", error, "Raw response:", text)
//       // Fallback if JSON parsing fails
//       foodAnalysis = {
//         name: "Unknown food item",
//         calories: 0,
//         nutritionalWarning: "Could not analyze nutritional content",
//         ingredients: ["Could not identify ingredients"],
//         preparationMethod: "Could not determine preparation method",
//         nutritionalInfo: {
//           protein: "0g",
//           carbs: "0g",
//           fat: "0g",
//           fiber: "0g",
//           vitamins: ["Unknown"],
//           minerals: ["Unknown"],
//         },
//         healthBenefits: ["Could not determine health benefits"],
//         healthierAlternatives: ["Could not suggest alternatives"],
//       }
//     }

//     // Add current time
//     const now = new Date()
//     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

//     return {
//       id: Date.now().toString(),
//       name: foodAnalysis.name || "Unknown food",
//       calories: foodAnalysis.calories || 0,
//       nutritionalWarning: foodAnalysis.nutritionalWarning || null,
//       ingredients: foodAnalysis.ingredients || ["Unknown"],
//       preparationMethod: foodAnalysis.preparationMethod || "Unknown",
//       nutritionalInfo: foodAnalysis.nutritionalInfo || {
//         protein: "0g",
//         carbs: "0g",
//         fat: "0g",
//         fiber: "0g",
//         vitamins: ["Unknown"],
//         minerals: ["Unknown"],
//       },
//       healthBenefits: foodAnalysis.healthBenefits || ["Unknown"],
//       healthierAlternatives: foodAnalysis.healthierAlternatives || ["Unknown"],
//       time: timeString,
//       imageUrl: imageUri,
//     }
//   } catch (error) {
//     console.error("Error analyzing food image:", error)
//     // Return a fallback response instead of throwing
//     const now = new Date()
//     const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

//     return {
//       id: Date.now().toString(),
//       name: "Food item (analysis failed)",
//       calories: 0,
//       nutritionalWarning: "Could not analyze nutritional content",
//       ingredients: ["Could not identify ingredients"],
//       preparationMethod: "Could not determine preparation method",
//       nutritionalInfo: {
//         protein: "0g",
//         carbs: "0g",
//         fat: "0g",
//         fiber: "0g",
//         vitamins: ["Unknown"],
//         minerals: ["Unknown"],
//       },
//       healthBenefits: ["Could not determine health benefits"],
//       healthierAlternatives: ["Could not suggest alternatives"],
//       time: timeString,
//       imageUrl: imageUri,
//     }
//   }
// }

// // Translate text using Gemini
// export const translateText = async (text: string, targetLanguage: string) => {
//   try {
//     if (!GOOGLE_API_KEY) {
//       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
//     }

//     // Access the model
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

//     const prompt = `
//       Translate the following text to ${targetLanguage}:
      
//       "${text}"
      
//       Provide only the translated text without any additional explanations or quotation marks.
//     `

//     // Generate content
//     const result = await model.generateContent(prompt)
//     const response = await result.response
//     return response.text().trim()
//   } catch (error) {
//     console.error("Error translating text:", error)
//     return text // Return original text if translation fails
//   }
// }

// // Get AI suggestions based on health and food data
// export const getAiSuggestions = async (healthData: any, foodData: any) => {
//   try {
//     if (!GOOGLE_API_KEY) {
//       return "Add your Gemini API key to get personalized health suggestions based on your data."
//     }

//     // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

//     const prompt = `
//       Based on the following health and food data, provide personalized suggestions for an elderly person:
      
//       Health Data: ${JSON.stringify(healthData)}
//       Food Data: ${JSON.stringify(foodData)}
      
//       Provide suggestions for:
//       1. Physical activities appropriate for elderly
//       2. Dietary recommendations
//       3. Health monitoring tips
      
//       Keep your response concise, friendly, and easy to understand for an elderly person. 
//       Use simple language and focus on practical advice.
//       Limit your response to 3-4 sentences.
//     `

//     // Generate content
//     const result = await model.generateContent(prompt)
//     const response = await result.response
//     return response.text()
//   } catch (error) {
//     console.error("Error getting AI suggestions:", error)
//     return "Try taking a 15-minute walk today and stay hydrated. Include more colorful vegetables in your meals and consider reducing salt intake. Remember to measure your blood pressure regularly and take medications as prescribed."
//   }
// }

// // Analyze image for object detection using Gemini
// export const analyzeImageForObjects = async (imageUri: string) => {
//   try {
//     if (!GOOGLE_API_KEY) {
//       throw new Error("Gemini API key is missing. Please add it to your environment variables.")
//     }

//     // Access the model
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

//     // Convert image to format required by Gemini
//     const imagePart = await fileToGenerativePart(imageUri)

//     const prompt = `
//       I'm creating an app for blind users that detects objects using a smartphone camera.
//       Analyze this image and identify all objects present.
      
//       For each object, provide:
//       1. The name of the object
//       2. The approximate position in the image (e.g., "center", "top left", "bottom right")
//       3. Any potential hazards or obstacles
      
//       Also provide a helpful, conversational description that:
//       1. Summarizes what objects are present and their approximate locations relative to each other
//       2. Mentions any potential hazards or obstacles
//       3. Provides context about the environment based on the objects detected
//       4. Suggests any relevant actions the user might want to take
      
//       Format your response as a valid JSON object with the following structure:
//       {
//         "objects": [
//           {
//             "name": "object name",
//             "position": "position in image",
//             "isHazard": boolean
//           },
//           ...
//         ],
//         "description": "A natural, conversational description optimized for text-to-speech for a blind user"
//       }
      
//       Make the description clear, concise, and optimized for text-to-speech.
//       Use natural, conversational language as if you're speaking to a blind person.
//       Avoid technical terms and focus on practical information.
//       Keep the description under 5 sentences for clarity.
//     `

//     // Generate content
//     const result = await model.generateContent([prompt, imagePart])
//     const response = await result.response
//     const text = response.text().trim()

//     // Parse the JSON response with error handling
//     try {
//       // Clean the text to ensure it's valid JSON
//       const cleanedText = text.replace(/```json|```/g, "").trim()
//       return JSON.parse(cleanedText)
//     } catch (error) {
//       console.error("Error parsing JSON response:", error, "Raw response:", text)

//       // Try to extract a description from the text if JSON parsing fails
//       let description =
//         "I can see an image, but I'm having trouble identifying specific objects. Please try again with a clearer photo or different lighting."

//       if (text.includes("description")) {
//         const descriptionMatch = text.match(/"description"\s*:\s*"([^"]+)"/)
//         if (descriptionMatch && descriptionMatch[1]) {
//           description = descriptionMatch[1]
//         }
//       }

//       // Return a basic structure
//       return {
//         objects: [],
//         description: description,
//       }
//     }
//   } catch (error) {
//     console.error("Error analyzing image for objects:", error)
//     return {
//       objects: [],
//       description:
//         "I encountered an error while analyzing this image. Please try again or check your internet connection.",
//     }
//   }
// }







import { GoogleGenerativeAI } from "@google/generative-ai"
import * as FileSystem from "expo-file-system"
import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
import Constants from "expo-constants"

// Initialize the Google Generative AI with your API key
const GOOGLE_API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// Convert an image to base64 for Gemini API
async function fileToGenerativePart(imageUri: string) {
  try {
    // For remote URLs, fetch and encode
    if (imageUri.startsWith("http")) {
      // Download the image to a local file
      const fileUri = FileSystem.cacheDirectory + "temp_image.jpg"
      await FileSystem.downloadAsync(imageUri, fileUri)

      // Resize and compress the image if needed (to reduce size)
      const manipResult = await manipulateAsync(
        fileUri,
        [{ resize: { width: 800 } }], // Resize to reasonable dimensions
        { compress: 0.8, format: SaveFormat.JPEG },
      )

      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      return {
        inlineData: {
          data: base64,
          mimeType: "image/jpeg",
        },
      }
    }
    // For local file URIs (like from camera)
    else {
      // Resize and compress the image if needed
      const manipResult = await manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // Resize to reasonable dimensions
        { compress: 0.8, format: SaveFormat.JPEG },
      )

      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      return {
        inlineData: {
          data: base64,
          mimeType: "image/jpeg",
        },
      }
    }
  } catch (error) {
    console.error("Error processing image:", error)
    throw new Error("Failed to process image")
  }
}

// Analyze food image using Gemini
export const analyzeFoodImage = async (imageUri: string) => {
  try {
    if (!GOOGLE_API_KEY) {
      throw new Error("Gemini API key is missing. Please add it to your environment variables.")
    }

    // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro-vision
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Convert image to format required by Gemini
    const imagePart = await fileToGenerativePart(imageUri)

    const prompt = `
      Analyze this food image and provide the following information in detail:
      1. What food item(s) are in the image?
      2. Estimate the calories in this meal
      3. Identify any nutritional warnings (high salt, sugar, fat, etc.)
      4. List all ingredients used to make this food
      5. Describe the preparation method
      6. List all nutritional information (protein, carbs, fat, fiber, vitamins, minerals)
      7. Provide health benefits of this food
      8. Suggest any dietary modifications for healthier version
      
      Format your response as a valid JSON object with the following structure:
      {
        "name": "Food name",
        "calories": number,
        "nutritionalWarning": "Warning message or null if none",
        "ingredients": ["ingredient1", "ingredient2", ...],
        "preparationMethod": "Detailed preparation steps",
        "nutritionalInfo": {
          "protein": "amount in grams",
          "carbs": "amount in grams",
          "fat": "amount in grams",
          "fiber": "amount in grams",
          "vitamins": ["vitamin1", "vitamin2", ...],
          "minerals": ["mineral1", "mineral2", ...]
        },
        "healthBenefits": ["benefit1", "benefit2", ...],
        "healthierAlternatives": ["alternative1", "alternative2", ...]
      }
      
      Ensure the response is properly formatted JSON with no trailing commas or extra characters.
    `

    // Generate content
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text().trim()

    // Parse the JSON response with error handling
    let foodAnalysis
    try {
      // Clean the text to ensure it's valid JSON
      // Remove any markdown code block indicators if present
      const cleanedText = text.replace(/```json|```/g, "").trim()
      foodAnalysis = JSON.parse(cleanedText)
    } catch (error) {
      console.error("Error parsing JSON response:", error, "Raw response:", text)
      // Fallback if JSON parsing fails
      foodAnalysis = {
        name: "Unknown food item",
        calories: 0,
        nutritionalWarning: "Could not analyze nutritional content",
        ingredients: ["Could not identify ingredients"],
        preparationMethod: "Could not determine preparation method",
        nutritionalInfo: {
          protein: "0g",
          carbs: "0g",
          fat: "0g",
          fiber: "0g",
          vitamins: ["Unknown"],
          minerals: ["Unknown"],
        },
        healthBenefits: ["Could not determine health benefits"],
        healthierAlternatives: ["Could not suggest alternatives"],
      }
    }

    // Add current time
    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    return {
      id: Date.now().toString(),
      name: foodAnalysis.name || "Unknown food",
      calories: foodAnalysis.calories || 0,
      nutritionalWarning: foodAnalysis.nutritionalWarning || null,
      ingredients: foodAnalysis.ingredients || ["Unknown"],
      preparationMethod: foodAnalysis.preparationMethod || "Unknown",
      nutritionalInfo: foodAnalysis.nutritionalInfo || {
        protein: "0g",
        carbs: "0g",
        fat: "0g",
        fiber: "0g",
        vitamins: ["Unknown"],
        minerals: ["Unknown"],
      },
      healthBenefits: foodAnalysis.healthBenefits || ["Unknown"],
      healthierAlternatives: foodAnalysis.healthierAlternatives || ["Unknown"],
      time: timeString,
      imageUrl: imageUri,
    }
  } catch (error) {
    console.error("Error analyzing food image:", error)
    // Return a fallback response instead of throwing
    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    return {
      id: Date.now().toString(),
      name: "Food item (analysis failed)",
      calories: 0,
      nutritionalWarning: "Could not analyze nutritional content",
      ingredients: ["Could not identify ingredients"],
      preparationMethod: "Could not determine preparation method",
      nutritionalInfo: {
        protein: "0g",
        carbs: "0g",
        fat: "0g",
        fiber: "0g",
        vitamins: ["Unknown"],
        minerals: ["Unknown"],
      },
      healthBenefits: ["Could not determine health benefits"],
      healthierAlternatives: ["Could not suggest alternatives"],
      time: timeString,
      imageUrl: imageUri,
    }
  }
}

// Translate text using Gemini
export const translateText = async (text: string, targetLanguage: string) => {
  try {
    if (!GOOGLE_API_KEY) {
      throw new Error("Gemini API key is missing. Please add it to your environment variables.")
    }

    // Access the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Translate the following text to ${targetLanguage}:
      
      "${text}"
      
      Provide only the translated text without any additional explanations or quotation marks.
    `

    // Generate content
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error("Error translating text:", error)
    return text // Return original text if translation fails
  }
}

// Get AI suggestions based on health and food data
export const getAiSuggestions = async (healthData: any, foodData: any) => {
  try {
    if (!GOOGLE_API_KEY) {
      return "Add your Gemini API key to get personalized health suggestions based on your data."
    }

    // Access the model - using gemini-1.5-flash instead of deprecated gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Based on the following health and food data, provide personalized suggestions for an elderly person:
      
      Health Data: ${JSON.stringify(healthData)}
      Food Data: ${JSON.stringify(foodData)}
      
      Provide suggestions for:
      1. Physical activities appropriate for elderly
      2. Dietary recommendations
      3. Health monitoring tips
      
      Keep your response concise, friendly, and easy to understand for an elderly person. 
      Use simple language and focus on practical advice.
      Limit your response to 3-4 sentences.
    `

    // Generate content
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Error getting AI suggestions:", error)
    return "Try taking a 15-minute walk today and stay hydrated. Include more colorful vegetables in your meals and consider reducing salt intake. Remember to measure your blood pressure regularly and take medications as prescribed."
  }
}

// Analyze image for object detection using Gemini
export const analyzeImageForObjects = async (imageUri: string) => {
  try {
    if (!GOOGLE_API_KEY) {
      throw new Error("Gemini API key is missing. Please add it to your environment variables.")
    }

    // Access the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Convert image to format required by Gemini
    const imagePart = await fileToGenerativePart(imageUri)

    const prompt = `
      I'm creating an app for blind users that detects objects using a smartphone camera.
      Analyze this image and identify all objects present.
      
      For each object, provide:
      1. The name of the object
      2. The approximate position in the image (e.g., "center", "top left", "bottom right")
      3. Any potential hazards or obstacles
      
      Also provide a helpful, conversational description that:
      1. Summarizes what objects are present and their approximate locations relative to each other
      2. Mentions any potential hazards or obstacles
      3. Provides context about the environment based on the objects detected
      4. Suggests any relevant actions the user might want to take
      
      Format your response as a valid JSON object with the following structure:
      {
        "objects": [
          {
            "name": "object name",
            "position": "position in image",
            "isHazard": boolean
          },
          ...
        ],
        "description": "A natural, conversational description optimized for text-to-speech for a blind user"
      }
      
      Make the description clear, concise, and optimized for text-to-speech.
      Use natural, conversational language as if you're speaking to a blind person.
      Avoid technical terms and focus on practical information.
      Keep the description under 5 sentences for clarity.
    `

    // Generate content
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text().trim()

    // Parse the JSON response with error handling
    try {
      // Clean the text to ensure it's valid JSON
      const cleanedText = text.replace(/```json|```/g, "").trim()
      return JSON.parse(cleanedText)
    } catch (error) {
      console.error("Error parsing JSON response:", error, "Raw response:", text)

      // Try to extract a description from the text if JSON parsing fails
      let description =
        "I can see an image, but I'm having trouble identifying specific objects. Please try again with a clearer photo or different lighting."

      if (text.includes("description")) {
        const descriptionMatch = text.match(/"description"\s*:\s*"([^"]+)"/)
        if (descriptionMatch && descriptionMatch[1]) {
          description = descriptionMatch[1]
        }
      }

      // Return a basic structure
      return {
        objects: [],
        description: description,
      }
    }
  } catch (error) {
    console.error("Error analyzing image for objects:", error)
    return {
      objects: [],
      description:
        "I encountered an error while analyzing this image. Please try again or check your internet connection.",
    }
  }
}
