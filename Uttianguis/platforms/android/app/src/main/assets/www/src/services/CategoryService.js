import api from "./api"

export const getCategories = async () => {
  try {
    const response = await api.get("/categories")
    return response.data
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw error.response?.data || { message: "Failed to fetch categories" }
  }
}

export const getCategoryById = async (id) => {
  try {
    const response = await api.get(`/categories/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error)
    throw error.response?.data || { message: "Failed to fetch category" }
  }
}

export const getProductsByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/categories/${categoryId}/products`)
    return response.data
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId}:`, error)
    throw error.response?.data || { message: "Failed to fetch products by category" }
  }
}

