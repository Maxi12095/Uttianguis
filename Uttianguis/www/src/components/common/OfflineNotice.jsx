"use client"

import { useState, useEffect } from "react"
import { isOnline, syncPendingData } from "../../utils/cordovaHelpers"

const OfflineNotice = () => {
  const [online, setOnline] = useState(true)
  const [hasPendingData, setHasPendingData] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Verificar estado inicial
    setOnline(isOnline())

    // Verificar si hay datos pendientes
    checkPendingData()

    // Configurar listeners
    const handleOnline = () => {
      setOnline(true)
      // Intentar sincronizar automáticamente al recuperar conexión
      handleSync()
    }

    const handleOffline = () => {
      setOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Si estamos en Cordova, también escuchamos los eventos específicos
    if (typeof document.addEventListener === "function") {
      document.addEventListener("online", handleOnline, false)
      document.addEventListener("offline", handleOffline, false)
    }

    // Verificar periódicamente si hay datos pendientes
    const interval = setInterval(checkPendingData, 30000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)

      if (typeof document.removeEventListener === "function") {
        document.removeEventListener("online", handleOnline, false)
        document.removeEventListener("offline", handleOffline, false)
      }

      clearInterval(interval)
    }
  }, [])

  const checkPendingData = () => {
    // Verificar si hay operaciones pendientes
    if (window.pendingOperations && window.pendingOperations.length > 0) {
      setHasPendingData(true)
    } else {
      const storedOperations = localStorage.getItem("pendingOperations")
      setHasPendingData(storedOperations && JSON.parse(storedOperations).length > 0)
    }
  }

  const handleSync = async () => {
    if (!online || syncing) return

    setSyncing(true)
    try {
      await syncPendingData()
      checkPendingData()
    } catch (error) {
      console.error("Error al sincronizar datos:", error)
    } finally {
      setSyncing(false)
    }
  }

  if (online && !hasPendingData) {
    return null
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-2 text-center z-50 ${online ? "bg-blue-500" : "bg-yellow-500"} text-white`}
    >
      {!online && <p className="font-bold">Sin conexión a Internet</p>}

      {online && hasPendingData && (
        <div className="flex justify-center items-center space-x-2">
          <p className="font-bold">Hay datos pendientes de sincronizar</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-white text-blue-500 px-2 py-1 rounded text-sm font-bold"
          >
            {syncing ? "Sincronizando..." : "Sincronizar ahora"}
          </button>
        </div>
      )}

      {!online && <p className="text-sm">Algunas funciones pueden no estar disponibles</p>}
    </div>
  )
}

export default OfflineNotice

