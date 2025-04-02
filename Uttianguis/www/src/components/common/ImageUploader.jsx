"use client"

import { useState, useRef, useEffect } from "react"
import { isCordova, captureImage, uploadFile, isOnline, saveOfflineOperation } from "../../utils/cordovaHelpers"

const ImageUploader = ({
  onImageUploaded,
  maxFiles = 5,
  acceptedTypes = "image/*",
  endpoint = "/api/upload",
  allowOfflineUpload = false,
  className = "",
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const fileInputRef = useRef(null)

  // Verificar estado de conexión
  useEffect(() => {
    const checkOnlineStatus = () => {
      setOfflineMode(!isOnline())
    }

    checkOnlineStatus()

    window.addEventListener("online", checkOnlineStatus)
    window.addEventListener("offline", checkOnlineStatus)

    if (typeof document.addEventListener === "function") {
      document.addEventListener("online", checkOnlineStatus, false)
      document.addEventListener("offline", checkOnlineStatus, false)
    }

    return () => {
      window.removeEventListener("online", checkOnlineStatus)
      window.removeEventListener("offline", checkOnlineStatus)

      if (typeof document.removeEventListener === "function") {
        document.removeEventListener("online", checkOnlineStatus, false)
        document.removeEventListener("offline", checkOnlineStatus, false)
      }
    }
  }, [])

  const handleFileChange = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (files.length > maxFiles) {
      setError(`No puedes subir más de ${maxFiles} archivos a la vez`)
      return
    }

    await uploadFiles(files)
  }

  const uploadFiles = async (files) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    // Verificar si estamos offline
    if (offlineMode && !allowOfflineUpload) {
      setError("No hay conexión a Internet. Por favor, intenta más tarde.")
      setUploading(false)
      return
    }

    try {
      const uploadedFiles = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const progress = Math.round(((i + 1) / files.length) * 100)
        setUploadProgress(progress)

        // Si estamos offline y se permite subida offline, guardar para sincronización posterior
        if (offlineMode && allowOfflineUpload) {
          // Generar URL temporal para la imagen
          const tempUrl = URL.createObjectURL(file)
          uploadedFiles.push(tempUrl)

          // Guardar para sincronización posterior
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64data = reader.result
            saveOfflineOperation("upload", endpoint, {
              file: base64data,
              type: file.type,
              name: file.name,
              params: {
                type: "product", // o cualquier otro tipo según el contexto
              },
            })
          }
          reader.readAsDataURL(file)

          continue
        }

        // Subir archivo normalmente si hay conexión
        const result = await uploadFile(file, endpoint, {
          fileKey: "image",
          params: {
            type: "product", // o cualquier otro tipo según el contexto
          },
          onProgress: (progress) => {
            setUploadProgress(progress)
          },
        })

        uploadedFiles.push(result.fileUrl || result.url)
      }

      if (onImageUploaded) {
        onImageUploaded(uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles)
      }
    } catch (err) {
      console.error("Error al subir imágenes:", err)
      setError("Error al subir las imágenes. Por favor, intenta de nuevo.")
    } finally {
      setUploading(false)
      // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCaptureImage = async (source) => {
    if (!isCordova()) {
      // En navegador, simplemente abrimos el selector de archivos
      fileInputRef.current.click()
      return
    }

    try {
      const imageURI = await captureImage(source, {
        quality: 75,
        allowEdit: true,
        saveToPhotoAlbum: false,
      })

      if (!imageURI) {
        // El usuario canceló la captura
        return
      }

      setUploading(true)
      setError(null)

      // Verificar si estamos offline
      if (offlineMode && !allowOfflineUpload) {
        setError("No hay conexión a Internet. Por favor, intenta más tarde.")
        setUploading(false)
        return
      }

      // Si estamos offline y se permite subida offline, guardar para sincronización posterior
      if (offlineMode && allowOfflineUpload) {
        // En este caso, guardamos la URI de la imagen para procesarla después
        saveOfflineOperation("upload", endpoint, {
          fileUri: imageURI,
          params: {
            type: "product", // o cualquier otro tipo según el contexto
          },
        })

        if (onImageUploaded) {
          onImageUploaded(imageURI)
        }

        setUploading(false)
        return
      }

      // Subir imagen normalmente si hay conexión
      const result = await uploadFile(imageURI, endpoint, {
        fileKey: "image",
        params: {
          type: "product", // o cualquier otro tipo según el contexto
        },
        onProgress: (progress) => {
          setUploadProgress(progress)
        },
      })

      if (onImageUploaded) {
        onImageUploaded(result.fileUrl || result.url)
      }
    } catch (err) {
      console.error("Error al capturar/subir imagen:", err)
      setError("Error al procesar la imagen. Por favor, intenta de nuevo.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`image-uploader ${className}`}>
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedTypes}
        multiple={maxFiles > 1}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Seleccionar archivos
        </button>

        {isCordova() && (
          <>
            <button
              type="button"
              onClick={() => handleCaptureImage("camera")}
              disabled={uploading}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            >
              Tomar foto
            </button>

            <button
              type="button"
              onClick={() => handleCaptureImage("gallery")}
              disabled={uploading}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
            >
              Galería
            </button>
          </>
        )}
      </div>

      {offlineMode && allowOfflineUpload && (
        <div className="mt-2 text-sm text-yellow-600">
          <p>Modo sin conexión: Las imágenes se subirán cuando vuelvas a estar en línea</p>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Subiendo... {uploadProgress}%</p>
        </div>
      )}
    </div>
  )
}

export default ImageUploader

