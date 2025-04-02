// Adding authService.js since it's referenced in api.js

import jwtDecode from "jwt-decode"

// Storage keys
const TOKEN_KEY = "uttiangisAuthToken"
const USER_KEY = "uttiangisUser"

/**
 * Stores the authentication token in local storage
 * @param {String} token - JWT token
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Retrieves the authentication token from local storage
 * @returns {String|null} - JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Removes the authentication token from local storage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Stores the user data in local storage
 * @param {Object} user - User data
 */
export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Retrieves the user data from local storage
 * @returns {Object|null} - User data or null if not found
 */
export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY)
  return userData ? JSON.parse(userData) : null
}

/**
 * Checks if the user is authenticated
 * @returns {Boolean} - True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false

  try {
    const decoded = jwtDecode(token)
    const currentTime = Date.now() / 1000

    // Check if token is expired
    if (decoded.exp < currentTime) {
      removeToken()
      return false
    }

    return true
  } catch (error) {
    removeToken()
    return false
  }
}

/**
 * Gets the user role from the token
 * @returns {String|null} - User role or null if not authenticated
 */
export const getUserRole = () => {
  const token = getToken()
  if (!token) return null

  try {
    const decoded = jwtDecode(token)
    return decoded.role || "user"
  } catch (error) {
    return null
  }
}

/**
 * Checks if the user is an admin
 * @returns {Boolean} - True if admin, false otherwise
 */
export const isAdmin = () => {
  const role = getUserRole()
  return role === "admin"
}

export default {
  setToken,
  getToken,
  removeToken,
  setUser,
  getUser,
  isAuthenticated,
  getUserRole,
  isAdmin,
}

