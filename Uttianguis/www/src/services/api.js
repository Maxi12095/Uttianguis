import axios from "axios"
import { getToken, removeToken } from "./authService"
import { isOnline } from "../utils/cordovaHelpers"
import { queueOfflineRequest } from "../utils/offlineQueue"

// Create axios instance with base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      removeToken()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Wrapper for API calls that handles offline mode
const apiCall = async (method, endpoint, data = null, options = {}) => {
  const online = await isOnline()

  if (!online) {
    // If offline, queue the request for later
    return queueOfflineRequest({
      method,
      endpoint,
      data,
      options,
    })
  }

  try {
    let response
    switch (method.toLowerCase()) {
      case "get":
        response = await api.get(endpoint, { params: data })
        break
      case "post":
        response = await api.post(endpoint, data, options)
        break
      case "put":
        response = await api.put(endpoint, data)
        break
      case "delete":
        response = await api.delete(endpoint, { data })
        break
      default:
        throw new Error(`Unsupported method: ${method}`)
    }
    return response.data
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error)
    throw error
  }
}

// API service methods
const apiService = {
  // Auth endpoints
  login: (credentials) => apiCall("post", "/auth/login", credentials),
  register: (userData) => apiCall("post", "/auth/register", userData),
  verifyToken: () => apiCall("get", "/auth/verify"),

  // User endpoints
  getCurrentUser: () => apiCall("get", "/users/me"),
  updateProfile: (userData) => apiCall("put", "/users/me", userData),
  updatePassword: (passwordData) => apiCall("put", "/users/me/password", passwordData),

  // Product endpoints
  getProducts: (params) => apiCall("get", "/products", params),
  getProductById: (id) => apiCall("get", `/products/${id}`),
  createProduct: (productData) => apiCall("post", "/products", productData),
  updateProduct: (id, productData) => apiCall("put", `/products/${id}`, productData),
  deleteProduct: (id) => apiCall("delete", `/products/${id}`),

  // Category endpoints
  getCategories: () => apiCall("get", "/categories"),
  getCategoryById: (id) => apiCall("get", `/categories/${id}`),
  getProductsByCategory: (categoryId) => apiCall("get", `/categories/${categoryId}/products`),

  // Favorite endpoints
  getFavorites: () => apiCall("get", "/favorites"),
  addFavorite: (productId) => apiCall("post", "/favorites", { productId }),
  removeFavorite: (productId) => apiCall("delete", `/favorites/${productId}`),

  // Report endpoints
  reportProduct: (productId, reason) => apiCall("post", "/reports", { productId, reason }),

  // Admin endpoints
  getReports: () => apiCall("get", "/admin/reports"),
  getUsers: () => apiCall("get", "/admin/users"),
  banUser: (userId) => apiCall("put", `/admin/users/${userId}/ban`),
  unbanUser: (userId) => apiCall("put", `/admin/users/${userId}/unban`),

  // Generic request method for custom endpoints
  request: (method, endpoint, data, options) => apiCall(method, endpoint, data, options),
}

export default apiService

