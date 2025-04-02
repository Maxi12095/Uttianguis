/**
 * Utilidades para integración con Apache Cordova
 */

// Detectar si estamos en un entorno Cordova
export const isCordova = () => {
  return typeof window !== "undefined" && !!window.cordova
}

// Subir archivo (adaptado para funcionar tanto en navegador como en Cordova)
export const uploadFile = async (file, uploadUrl, options = {}) => {
  if (isCordova()) {
    // Usar la implementación de Cordova
    if (typeof window.uploadFileCordova === "function") {
      return window.uploadFileCordova(file, uploadUrl, options)
    } else {
      console.error("La función uploadFileCordova no está disponible")
      // Fallback a implementación estándar
      return uploadFileStandard(file, uploadUrl, options)
    }
  } else {
    // Implementación para navegador estándar
    return uploadFileStandard(file, uploadUrl, options)
  }
}

// Implementación estándar de carga de archivos para navegador
const uploadFileStandard = async (file, uploadUrl, options = {}) => {
  const formData = new FormData()
  formData.append(options.fileKey || "file", file)

  // Añadir parámetros adicionales si existen
  if (options.params) {
    Object.keys(options.params).forEach((key) => {
      formData.append(key, options.params[key])
    })
  }

  const token = localStorage.getItem("token")
  const apiBaseUrl = window.API_BASE_URL || ""

  const response = await fetch(apiBaseUrl + uploadUrl, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al subir archivo: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json()
}

// Capturar imagen (cámara o galería)
export const captureImage = async (source = "camera", options = {}) => {
  if (isCordova()) {
    try {
      if (source === "camera" && typeof window.takePicture === "function") {
        return await window.takePicture(options)
      } else if (source === "gallery" && typeof window.selectPicture === "function") {
        return await window.selectPicture(options)
      } else {
        console.error(`Método de captura no disponible: ${source}`)
        return null
      }
    } catch (error) {
      // Si el error es de cancelación por el usuario, no lo tratamos como error
      if (error.message && (error.message.includes("cancelada") || error.message.includes("cancelled"))) {
        console.log("Captura cancelada por el usuario")
        return null
      }

      console.error("Error al capturar imagen:", error)
      throw error
    }
  } else {
    // En navegador, simplemente devolvemos null y dejamos que la UI maneje la selección de archivos
    console.log("Captura de imagen no disponible en navegador estándar")
    return null
  }
}

// Abrir WhatsApp con número formateado
export const openWhatsApp = (phoneNumber, message = "") => {
  const formattedNumber = phoneNumber.replace(/\D/g, "")
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`

  if (isCordova()) {
    // En Cordova, usamos el plugin InAppBrowser si está disponible
    if (window.cordova && window.cordova.InAppBrowser) {
      window.cordova.InAppBrowser.open(whatsappUrl, "_system")
    } else {
      window.open(whatsappUrl, "_system")
    }
  } else {
    // En navegador estándar
    window.open(whatsappUrl, "_blank")
  }
}

// Verificar conexión a internet
export const isOnline = () => {
  if (isCordova() && navigator.connection) {
    return navigator.connection.type !== "none"
  } else {
    return navigator.onLine
  }
}

// Mostrar notificación nativa
export const showNativeNotification = (title, message, options = {}) => {
  if (
    isCordova() &&
    window.cordova &&
    window.cordova.plugins &&
    window.cordova.plugins.notification &&
    window.cordova.plugins.notification.local
  ) {
    window.cordova.plugins.notification.local.schedule({
      title: title,
      text: message,
      foreground: true,
      ...options,
    })
  } else {
    // Fallback para navegador
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body: message })
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body: message })
          }
        })
      }
    } else {
      console.log(`Notificación: ${title} - ${message}`)
      // Aquí podrías mostrar una notificación en la UI
      alert(`${title}: ${message}`)
    }
  }
}

// Guardar operación para sincronización offline
export const saveOfflineOperation = (type, endpoint, data, id = null) => {
  if (typeof window.addPendingOperation === "function") {
    window.addPendingOperation({
      type,
      endpoint,
      data,
      id,
      timestamp: new Date().toISOString(),
    })
    return true
  } else {
    console.error("La función addPendingOperation no está disponible")
    return false
  }
}

// Forzar sincronización de datos pendientes
export const syncPendingData = async () => {
  if (typeof window.syncPendingData === "function") {
    return window.syncPendingData()
  } else {
    console.error("La función syncPendingData no está disponible")
    return false
  }
}

// Almacenamiento local mejorado (con soporte para SQLite en Cordova)
export const storage = {
  async get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key)
      return value !== null ? JSON.parse(value) : defaultValue
    } catch (error) {
      console.error(`Error al obtener ${key} del almacenamiento:`, error)
      return defaultValue
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error al guardar ${key} en el almacenamiento:`, error)
      return false
    }
  },

  async remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error al eliminar ${key} del almacenamiento:`, error)
      return false
    }
  },

  async clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error("Error al limpiar el almacenamiento:", error)
      return false
    }
  },
}

