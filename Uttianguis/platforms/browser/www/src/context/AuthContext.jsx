"use client"

import { createContext, useState, useContext, useEffect } from "react"
import axios from "axios"
import { API_URL } from "../config/constants"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)

  // Configurar token en axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["X-API-Key"] = token
      localStorage.setItem("token", token)
    } else {
      delete axios.defaults.headers.common["X-API-Key"]
      localStorage.removeItem("token")
    }
  }, [token])

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`)
        if (response.data && response.data.user) {
          setCurrentUser(response.data.user)
        } else {
          throw new Error("Datos de usuario inválidos")
        }
      } catch (error) {
        console.error("Error verificando token:", error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  // Registrar usuario
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData)
      if (response.data && response.data.token && response.data.user) {
        setToken(response.data.token)
        setCurrentUser(response.data.user)
        return response.data
      }
      throw new Error("Datos de registro inválidos")
    } catch (error) {
      console.error("Error en registro:", error)
      throw error
    }
  }

  // Iniciar sesión
  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials)
      if (response.data && response.data.token && response.data.user) {
        setToken(response.data.token)
        setCurrentUser(response.data.user)
        return response.data
      }
      throw new Error("Datos de inicio de sesión inválidos")
    } catch (error) {
      console.error("Error en inicio de sesión:", error)
      throw error
    }
  }

  // Cerrar sesión
  const logout = () => {
    setToken(null)
    setCurrentUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete axios.defaults.headers.common["X-API-Key"]
  }

  // Actualizar perfil de usuario
  const updateProfile = async (userData) => {
    try {
      const response = await axios.put(`${API_URL}/users/profile`, userData)
      if (response.data && response.data.user) {
        setCurrentUser({ ...currentUser, ...response.data.user })
        return response.data
      }
      throw new Error("Datos de perfil inválidos")
    } catch (error) {
      console.error("Error actualizando perfil:", error)
      throw error
    }
  }

  // Actualizar avatar
  const updateAvatar = async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/users/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      if (response.data && response.data.avatar) {
        setCurrentUser({ ...currentUser, avatar: response.data.avatar })
        return response.data
      }
      throw new Error("Datos de avatar inválidos")
    } catch (error) {
      console.error("Error actualizando avatar:", error)
      throw error
    }
  }

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    updateProfile,
    updateAvatar,
    isAuthenticated: !!token,
    isAdmin: currentUser?.role === "admin",
    isProfesor: currentUser?.role === "profesor",
    isEstudiante: currentUser?.role === "estudiante",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

