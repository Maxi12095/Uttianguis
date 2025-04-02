import { v4 as uuidv4 } from "uuid"
import { isOnline } from "../utils/cordovaHelpers"
import apiService from "./api"

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Supported image types
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

// Local storage key for pending uploads
const PENDING_UPLOADS_KEY = "uttiangisPendingUploads"

/**
 * Validates file before upload
 * @param {File} file - The file to validate
 * @returns {Object} - Validation result with status and message
 */
const validateFile = (file) => {
  if (!file) {
    return { valid: false, message: "No file provided" }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: "File type not supported. Please upload JPEG, PNG, GIF, or WebP images",
    }
  }

  return { valid: true }
}

/**
 * Compresses an image file to reduce size
 * @param {File} file - The image file to compress
 * @param {Number} quality - Compression quality (0-1)
 * @returns {Promise<Blob>} - Compressed image as Blob
 */
const compressImage = (file, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        let width = img.width
        let height = img.height
        const maxDimension = 1200

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        // Create canvas for compression
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Image compression failed"))
            }
          },
          file.type,
          quality,
        )
      }
      img.onerror = () => reject(new Error("Failed to load image"))
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
  })
}

/**
 * Stores a file in local storage for offline use
 * @param {File|Blob} file - The file to store
 * @param {String} type - The file type
 * @returns {Promise<String>} - Local file URI
 */
const storeFileLocally = async (file, type) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const fileId = uuidv4()
      const fileData = {
        id: fileId,
        data: reader.result,
        type,
        createdAt: new Date().toISOString(),
      }

      try {
        // Store in localStorage (for browser testing)
        const pendingUploads = JSON.parse(localStorage.getItem(PENDING_UPLOADS_KEY) || "[]")
        pendingUploads.push(fileData)
        localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(pendingUploads))

        // If in Cordova environment, also store in file system
        if (window.cordova && window.cordova.file) {
          const cordova = window.cordova // Assign window.cordova to cordova variable
          window.resolveLocalFileSystemURL(
            cordova.file.dataDirectory,
            (dirEntry) => {
              dirEntry.getFile(
                `${fileId}.${type.split("/")[1]}`,
                { create: true, exclusive: false },
                (fileEntry) => {
                  fileEntry.createWriter(
                    (writer) => {
                      writer.onwriteend = () => {
                        resolve(fileEntry.toURL())
                      }
                      writer.onerror = (err) => {
                        reject(err)
                      }

                      // Create a blob from the base64 data
                      const byteString = atob(reader.result.split(",")[1])
                      const ab = new ArrayBuffer(byteString.length)
                      const ia = new Uint8Array(ab)
                      for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i)
                      }
                      const blob = new Blob([ab], { type })
                      writer.write(blob)
                    },
                    (err) => reject(err),
                  )
                },
                (err) => reject(err),
              )
            },
            (err) => reject(err),
          )
        } else {
          resolve(fileId)
        }
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
  })
}

/**
 * Uploads a file to the server
 * @param {File|Blob} file - The file to upload
 * @param {String} path - The API endpoint path
 * @param {Object} metadata - Additional metadata to send with the file
 * @returns {Promise<Object>} - Server response
 */
const uploadFile = async (file, path = "/upload", metadata = {}) => {
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.message)
  }

  // Check if online
  const online = await isOnline()

  // Compress image before upload
  const compressedFile = await compressImage(file)

  if (!online) {
    // Store locally if offline
    const localUri = await storeFileLocally(compressedFile, file.type)

    // Queue for later upload
    const pendingUpload = {
      id: uuidv4(),
      file: localUri,
      path,
      metadata,
      createdAt: new Date().toISOString(),
    }

    const pendingUploads = JSON.parse(localStorage.getItem(PENDING_UPLOADS_KEY) || "[]")
    pendingUploads.push(pendingUpload)
    localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(pendingUploads))

    return {
      success: true,
      offline: true,
      message: "File queued for upload when online",
      localUri,
      pendingId: pendingUpload.id,
    }
  }

  // Upload to server if online
  const formData = new FormData()
  formData.append("file", compressedFile, file.name || `image.${file.type.split("/")[1]}`)

  // Add metadata
  Object.keys(metadata).forEach((key) => {
    formData.append(key, metadata[key])
  })

  try {
    const response = await apiService.request("post", path, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response
  } catch (error) {
    console.error("Upload failed:", error)

    // If upload fails, store locally as fallback
    const localUri = await storeFileLocally(compressedFile, file.type)

    return {
      success: false,
      offline: false,
      error: error.message,
      localUri,
    }
  }
}

/**
 * Uploads multiple files to the server
 * @param {Array<File>} files - Array of files to upload
 * @param {String} path - The API endpoint path
 * @param {Object} metadata - Additional metadata to send with the files
 * @returns {Promise<Array>} - Array of server responses
 */
const uploadMultipleFiles = async (files, path = "/upload", metadata = {}) => {
  const results = []

  for (const file of files) {
    try {
      const result = await uploadFile(file, path, metadata)
      results.push(result)
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        file: file.name,
      })
    }
  }

  return results
}

/**
 * Syncs pending uploads when online
 * @returns {Promise<Array>} - Results of sync operation
 */
const syncPendingUploads = async () => {
  const online = await isOnline()
  if (!online) {
    return { success: false, message: "Device is offline" }
  }

  const pendingUploads = JSON.parse(localStorage.getItem(PENDING_UPLOADS_KEY) || "[]")
  if (pendingUploads.length === 0) {
    return { success: true, message: "No pending uploads" }
  }

  const results = []
  const remainingUploads = []

  for (const upload of pendingUploads) {
    try {
      // Get file data from local storage
      let fileData

      if (window.cordova && window.cordova.file) {
        const cordova = window.cordova // Assign window.cordova to cordova variable
        // Get from Cordova file system
        fileData = await new Promise((resolve, reject) => {
          window.resolveLocalFileSystemURL(
            upload.file,
            (fileEntry) => {
              fileEntry.file(
                (file) => {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    resolve(reader.result)
                  }
                  reader.readAsArrayBuffer(file)
                },
                (err) => reject(err),
              )
            },
            (err) => reject(err),
          )
        })
      } else {
        // Get from localStorage
        const allFiles = JSON.parse(localStorage.getItem(PENDING_UPLOADS_KEY) || "[]")
        const storedFile = allFiles.find((f) => f.id === upload.file)
        if (storedFile) {
          fileData = storedFile.data
        }
      }

      if (!fileData) {
        throw new Error("File not found in local storage")
      }

      // Convert to blob
      let blob
      if (typeof fileData === "string" && fileData.startsWith("data:")) {
        // Handle base64 data URL
        const byteString = atob(fileData.split(",")[1])
        const mimeType = fileData.split(",")[0].split(":")[1].split(";")[0]
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }
        blob = new Blob([ab], { type: mimeType })
      } else {
        // Handle ArrayBuffer
        blob = new Blob([fileData])
      }

      // Upload to server
      const formData = new FormData()
      formData.append("file", blob, `file-${upload.id}.jpg`)

      // Add metadata
      Object.keys(upload.metadata || {}).forEach((key) => {
        formData.append(key, upload.metadata[key])
      })

      const response = await apiService.request("post", upload.path, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      results.push({
        id: upload.id,
        success: true,
        response,
      })
    } catch (error) {
      console.error("Sync upload failed:", error)
      results.push({
        id: upload.id,
        success: false,
        error: error.message,
      })

      // Keep failed uploads for retry
      remainingUploads.push(upload)
    }
  }

  // Update pending uploads
  localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(remainingUploads))

  return {
    success: true,
    results,
    remaining: remainingUploads.length,
  }
}

/**
 * Gets a file from a URL
 * @param {String} url - The file URL
 * @returns {Promise<Blob>} - The file as a Blob
 */
const getFileFromUrl = async (url) => {
  try {
    const response = await fetch(url)
    return await response.blob()
  } catch (error) {
    console.error("Failed to get file from URL:", error)
    throw error
  }
}

/**
 * Creates a data URL from a file
 * @param {File|Blob} file - The file to convert
 * @returns {Promise<String>} - Data URL
 */
const createDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Export the file service
const fileService = {
  uploadFile,
  uploadMultipleFiles,
  validateFile,
  compressImage,
  syncPendingUploads,
  getFileFromUrl,
  createDataUrl,
  MAX_FILE_SIZE,
  SUPPORTED_TYPES,
}

export default fileService

