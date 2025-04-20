import * as FileSystem from "expo-file-system"

// Upload file to Cloudinary
export const uploadToCloudinary = async (fileUri: string) => {
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing")
    }

    const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri)

    if (!fileInfo.exists) {
      throw new Error("File does not exist")
    }

    // Create form data for upload
    const formData = new FormData()
    formData.append("file", {
      uri: fileUri,
      type: "application/octet-stream",
      name: "upload.jpg",
    } as any)
    formData.append("upload_preset", uploadPreset)

    // Upload to Cloudinary
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    })

    const responseData = await response.json()

    if (response.ok) {
      return responseData.secure_url
    } else {
      throw new Error(responseData.error?.message || "Upload failed")
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw error
  }
}
