/**
 * Configuración específica para Apache Cordova
 * Este archivo debe incluirse en index.html cuando se compile para Cordova
 */

// Esperar a que el dispositivo esté listo
document.addEventListener("deviceready", onDeviceReady, false)

function onDeviceReady() {
  console.log("Cordova está listo y el dispositivo está preparado")

  // Configurar la URL base de la API según el entorno
  window.API_BASE_URL = "https://tianguis.somee.com" // Cambiar a tu URL de producción

  // En desarrollo, puedes usar la IP local de tu máquina
  if (window.location.hostname === "localhost" || /^192\.168\./.test(window.location.hostname)) {
    window.API_BASE_URL = "http://192.168.1.X:3000" // Cambiar a la IP de tu máquina de desarrollo
  }

  // Configurar manejo de errores global
  window.onerror = (message, source, lineno, colno, error) => {
    console.error("Error en la aplicación:", message, error)
    // Puedes implementar un sistema de registro de errores aquí
    return false
  }

  // Configurar manejo de conexión
  document.addEventListener("online", onOnline, false)
  document.addEventListener("offline", onOffline, false)

  // Verificar estado de conexión inicial
  checkConnection()

  // Solicitar permisos necesarios en Android 6.0+
  requestPermissions()
}

// Solicitar permisos necesarios
function requestPermissions() {
  // Usar el plugin correcto: cordova-plugin-android-permissions
  if (cordova && cordova.platformId === "android" && typeof cordova.plugins.androidPermissions !== "undefined") {
    const permissions = [
      cordova.plugins.androidPermissions.CAMERA,
      cordova.plugins.androidPermissions.READ_EXTERNAL_STORAGE,
      cordova.plugins.androidPermissions.WRITE_EXTERNAL_STORAGE,
    ]

    permissions.forEach((permission) => {
      cordova.plugins.androidPermissions.checkPermission(permission, (status) => {
        if (!status.hasPermission) {
          cordova.plugins.androidPermissions.requestPermission(
            permission,
            (success) => console.log("Permiso concedido:", permission),
            (error) => console.error("Permiso denegado:", permission, error),
          )
        }
      })
    })
  }
}

// Funciones para manejar el estado de la conexión
function onOnline() {
  document.body.classList.remove("offline")
  document.body.classList.add("online")
  console.log("Dispositivo en línea")

  // Sincronizar datos pendientes
  if (window.syncPendingData && typeof window.syncPendingData === "function") {
    window.syncPendingData()
  }
}

function onOffline() {
  document.body.classList.remove("online")
  document.body.classList.add("offline")
  console.log("Dispositivo sin conexión")

  // Mostrar notificación al usuario
  if (navigator.notification && typeof navigator.notification.alert === "function") {
    navigator.notification.alert(
      "Estás trabajando sin conexión. Algunas funciones pueden no estar disponibles.",
      null,
      "Sin conexión",
      "Entendido",
    )
  }
}

function checkConnection() {
  var networkState = navigator.connection ? navigator.connection.type : null

  // Definir estados de conexión
  var Connection = {
    UNKNOWN: "unknown",
    ETHERNET: "ethernet",
    WIFI: "wifi",
    CELL_2G: "2g",
    CELL_3G: "3g",
    CELL_4G: "4g",
    CELL: "cellular",
    NONE: "none",
  }

  var states = {}
  states[Connection.UNKNOWN] = "Conexión desconocida"
  states[Connection.ETHERNET] = "Ethernet"
  states[Connection.WIFI] = "WiFi"
  states[Connection.CELL_2G] = "2G"
  states[Connection.CELL_3G] = "3G"
  states[Connection.CELL_4G] = "4G"
  states[Connection.CELL] = "Conexión celular genérica"
  states[Connection.NONE] = "Sin conexión"

  console.log("Tipo de conexión: " + (networkState ? states[networkState] : "No detectado"))

  if (!networkState || networkState === Connection.NONE) {
    onOffline()
  } else {
    onOnline()
  }
}

// Función para manejar la carga de archivos en Cordova
window.uploadFileCordova = (fileURI, uploadUrl, options = {}) =>
  new Promise((resolve, reject) => {
    // Verificar que los plugins necesarios estén disponibles
    if (!window.FileTransfer) {
      console.error("FileTransfer plugin no disponible")
      return reject(new Error("FileTransfer plugin no disponible"))
    }

    const fileTransfer = new FileTransfer()
    const uploadOptions = new FileUploadOptions()

    // Configurar opciones de carga
    uploadOptions.fileKey = options.fileKey || "file"
    uploadOptions.fileName = fileURI.substr(fileURI.lastIndexOf("/") + 1)
    uploadOptions.mimeType = options.mimeType || "image/jpeg"
    uploadOptions.headers = {
      Authorization: localStorage.getItem("token") || "",
    }
    uploadOptions.params = options.params || {}
    uploadOptions.chunkedMode = false // Importante para evitar problemas con ciertos servidores

    // Mostrar progreso si está disponible
    if (options.onProgress && typeof options.onProgress === "function") {
      fileTransfer.onprogress = (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentage = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
          options.onProgress(percentage)
        }
      }
    }

    // Realizar la carga
    fileTransfer.upload(
      fileURI,
      encodeURI(window.API_BASE_URL + uploadUrl),
      (result) => {
        console.log("Archivo subido correctamente:", result)
        try {
          const response = JSON.parse(result.response)
          resolve(response)
        } catch (e) {
          console.error("Error al parsear respuesta:", e)
          resolve({ success: true, fileUrl: fileURI })
        }
      },
      (error) => {
        console.error("Error al subir archivo:", error)
        reject(error)
      },
      uploadOptions,
    )
  })

// Función para tomar foto con la cámara
window.takePicture = (options = {}) =>
  new Promise((resolve, reject) => {
    // Verificar que el plugin de cámara esté disponible
    if (!navigator.camera) {
      console.error("Camera plugin no disponible")
      return reject(new Error("Camera plugin no disponible"))
    }

    // Opciones por defecto
    const cameraOptions = {
      quality: options.quality || 75,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: Camera.MediaType.PICTURE,
      correctOrientation: true,
      saveToPhotoAlbum: options.saveToPhotoAlbum || false,
      cameraDirection: options.useFrontCamera ? Camera.Direction.FRONT : Camera.Direction.BACK,
    }

    navigator.camera.getPicture(
      (imageURI) => {
        resolve(imageURI)
      },
      (error) => {
        console.error("Error al tomar foto:", error)

        // Manejar errores específicos
        if (error === "Camera cancelled.") {
          reject(new Error("Captura cancelada por el usuario"))
        } else if (error === "No camera available") {
          reject(new Error("No hay cámara disponible en este dispositivo"))
        } else {
          reject(new Error("Error al acceder a la cámara: " + error))
        }
      },
      cameraOptions,
    )
  })

// Función para seleccionar imagen de la galería
window.selectPicture = (options = {}) =>
  new Promise((resolve, reject) => {
    // Verificar que el plugin de cámara esté disponible
    if (!navigator.camera) {
      console.error("Camera plugin no disponible")
      return reject(new Error("Camera plugin no disponible"))
    }

    // Opciones por defecto
    const galleryOptions = {
      quality: options.quality || 75,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: Camera.MediaType.PICTURE,
      correctOrientation: true,
      allowEdit: options.allowEdit || false,
    }

    navigator.camera.getPicture(
      (imageURI) => {
        resolve(imageURI)
      },
      (error) => {
        console.error("Error al seleccionar imagen:", error)

        // Manejar errores específicos
        if (error === "Selection cancelled.") {
          reject(new Error("Selección cancelada por el usuario"))
        } else if (error === "No gallery available") {
          reject(new Error("No hay galería disponible en este dispositivo"))
        } else {
          reject(new Error("Error al acceder a la galería: " + error))
        }
      },
      galleryOptions,
    )
  })

// Sistema de sincronización offline
window.pendingOperations = []

// Añadir operación pendiente
window.addPendingOperation = (operation) => {
  window.pendingOperations.push(operation)
  localStorage.setItem("pendingOperations", JSON.stringify(window.pendingOperations))
  console.log("Operación añadida a la cola para sincronización posterior")
}

// Sincronizar datos pendientes
window.syncPendingData = async () => {
  if (!navigator.onLine) {
    console.log("No hay conexión, no se puede sincronizar")
    return
  }

  // Cargar operaciones pendientes
  const storedOperations = localStorage.getItem("pendingOperations")
  if (storedOperations) {
    window.pendingOperations = JSON.parse(storedOperations)
  }

  if (window.pendingOperations.length === 0) {
    console.log("No hay operaciones pendientes para sincronizar")
    return
  }

  console.log(`Sincronizando ${window.pendingOperations.length} operaciones pendientes...`)

  // Procesar cada operación
  const operationsToProcess = [...window.pendingOperations]
  window.pendingOperations = []
  localStorage.removeItem("pendingOperations")

  for (const operation of operationsToProcess) {
    try {
      await processOperation(operation)
      console.log("Operación sincronizada correctamente:", operation.type)
    } catch (error) {
      console.error("Error al sincronizar operación:", error)
      // Volver a añadir la operación a la cola
      window.addPendingOperation(operation)
    }
  }

  console.log("Sincronización completada")
}

// Procesar una operación pendiente
async function processOperation(operation) {
  const token = localStorage.getItem("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }

  switch (operation.type) {
    case "create":
      await fetch(`${window.API_BASE_URL}${operation.endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(operation.data),
      })
      break

    case "update":
      await fetch(`${window.API_BASE_URL}${operation.endpoint}/${operation.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(operation.data),
      })
      break

    case "delete":
      await fetch(`${window.API_BASE_URL}${operation.endpoint}/${operation.id}`, {
        method: "DELETE",
        headers,
      })
      break

    default:
      throw new Error(`Tipo de operación desconocido: ${operation.type}`)
  }
}

// Inicializar Camera y otras variables globales para evitar errores
var Camera = {
  DestinationType: {
    DATA_URL: 0,
    FILE_URI: 1,
    NATIVE_URI: 2,
  },
  PictureSourceType: {
    PHOTOLIBRARY: 0,
    CAMERA: 1,
    SAVEDPHOTOALBUM: 2,
  },
  EncodingType: {
    JPEG: 0,
    PNG: 1,
  },
  MediaType: {
    PICTURE: 0,
    VIDEO: 1,
    ALLMEDIA: 2,
  },
  Direction: {
    BACK: 0,
    FRONT: 1,
  },
}

var cordova = window.cordova || {}
var FileTransfer = window.FileTransfer || {}
var FileUploadOptions = window.FileUploadOptions || {}