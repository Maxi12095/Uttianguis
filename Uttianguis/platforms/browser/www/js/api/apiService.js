// Módulo ES6 para servicios de API
import tokenService from './tokenService.js';
const apiService = {
  API_URL: "https://tianguis.somee.com/api",

  // Función para realizar solicitudes autenticadas
  fetchWithAuth: async function(endpoint, options = {}) {
    const token = tokenService.getToken();
    console.log("=== INICIO DE FETCH WITH AUTH ===");
    console.log("Endpoint:", endpoint);
    console.log("Token disponible:", token ? "Sí" : "No");
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    
    // Agregar token si existe
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["X-API-Key"] = token;
    }
    
    const fetchOptions = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include'
    };

    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error en fetchWithAuth:", error);
      throw error;
    }
  },

  // Función de login
  login: async function(email, password) {
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data));
      if (!response.ok) {
        throw new Error(data.message || data.title || 'Error en el inicio de sesión');
      }
      return data;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  },

  register: async function(userData) {
    try {
      const requestData = {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phoneNumber: userData.phone,
        role: "User"
      };
      
      console.log("Datos a enviar:", requestData);
      
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      console.log(`Respuesta del registro: ${response.status}`);
      
      const data = await response.json();
      console.log("Datos de registro recibidos:", data);
      
      if (!response.ok) {
        if (data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          throw new Error(errorMessages);
        }
        throw new Error(data.title || data.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  },

  // Productos
  getProducts: async function(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    
    try {
      // Si hay un userId, usar fetchWithAuth para obtener productos del usuario
      if (params.userId) {
        console.log(`Obteniendo productos del usuario ${params.userId}`);
        return await this.fetchWithAuth(`/users/${params.userId}/products${queryString}`);
      }
      
      // Para productos generales, usar fetch normal
      console.log(`Obteniendo productos de ${this.API_URL}/products${queryString}`);
      const response = await fetch(`${this.API_URL}/products${queryString}`);
      console.log(`Respuesta recibida: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Productos recibidos:", data);
      return data;
    } catch (error) {
      console.error("Error al obtener productos:", error);
      throw error;
    }
  },

  getFeaturedProducts: async function() {
    return await this.getProducts({ 
      featured: true,
      limit: 4,
      sort: 'createdAt',
      order: 'desc'
    });
  },

  getProductById: async function(productId) {
    return await this.fetchWithAuth(`/products/${productId}`);
  },

  createProduct: async function(productData) {
    try {
      const token = tokenService.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Convertir los datos a un objeto simple
      const formData = {
        title: productData.title,
        description: productData.description,
        price: productData.price,
        mainImageUrl: productData.mainImageUrl,
        categoryId: productData.categoryId,
        condition: productData.condition,
        //stock: productData.stock,
        meetingPoint: productData.meetingPoint || '',
        contactWhatsapp: productData.contactWhatsapp || ''
      };

      console.log('Datos a enviar:', formData);

      const response = await fetch(`${this.API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': token
        },
        body: JSON.stringify(formData)
      });

      console.log('Status de la respuesta:', response.status);
      
      // Si la respuesta no es ok, intentar obtener el mensaje de error
      if (!response.ok) {
        let errorMessage = 'Error al crear el producto';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } catch (e) {
          console.error('Error al parsear respuesta de error:', e);
        }
        throw new Error(errorMessage);
      }

      // Intentar parsear la respuesta
      try {
        const data = await response.json();
        return data;
      } catch (e) {
        console.error('Error al parsear respuesta:', e);
        throw new Error('Error al procesar la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error en createProduct:', error);
      throw error;
    }
  },

  updateProduct: async function(productId, productData) {
    return await this.fetchWithAuth(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async function(productId) {
    return await this.fetchWithAuth(`/products/${productId}`, {
      method: "DELETE",
    });
  },

  uploadProductImage: async function(productId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    return await this.fetchWithAuth(`/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
  },

  // Categorías
  getCategories: async function() {
    return await this.fetchWithAuth("/categories");
  },

  // Favoritos
  getFavorites: async function() {
    try {
      console.log("Obteniendo lista de favoritos...");
      const response = await this.fetchWithAuth("/favorites");
      console.log("Favoritos obtenidos:", response);
      return response || [];
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      return []; // Retornar array vacío en caso de error
    }
  },

  addFavorite: async function(productId) {
    try {
      console.log(`Agregando producto ${productId} a favoritos...`);
      if (!productId) {
        throw new Error("ID de producto no válido");
      }

      const response = await this.fetchWithAuth(`/favorites/${productId}`, {
        method: "POST"
      });
      
      console.log("Favorito agregado:", response);
      return response;
    } catch (error) {
      console.error(`Error al agregar favorito ${productId}:`, error);
      throw new Error("No se pudo agregar el producto a favoritos. Por favor, intente nuevamente.");
    }
  },

  removeFavorite: async function(productId) {
    try {
      console.log(`Eliminando producto ${productId} de favoritos...`);
      if (!productId) {
        throw new Error("ID de producto no válido");
      }

      const response = await this.fetchWithAuth(`/favorites/${productId}`, {
        method: "DELETE"
      });
      
      console.log("Favorito eliminado:", response);
      return response;
    } catch (error) {
      console.error(`Error al eliminar favorito ${productId}:`, error);
      throw new Error("No se pudo eliminar el producto de favoritos. Por favor, intente nuevamente.");
    }
  },

  // Reportes
  reportProduct: async function(productId, reason) {
    return await this.fetchWithAuth("/reports", {
      method: "POST",
      body: JSON.stringify({ productId, reason }),
    });
  },

  // Perfil de usuario
  getUserProfile: async function() {
    return await this.fetchWithAuth('/users/profile');
  },

  getCurrentUser: function() {
    return this.fetchWithAuth('/users/profile');
  },

  updateUserProfile: async function(profileData) {
    return this.fetchWithAuth('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  changePassword: async function(currentPassword, newPassword) {
    return this.fetchWithAuth('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
  },

  getUserById: async function(userId) {
    return this.fetchWithAuth(`/users/${userId}`);
  },

  rateUser: async function(userId, ratingData) {
    return this.fetchWithAuth(`/users/${userId}/rate`, {
      method: 'POST',
      body: JSON.stringify(ratingData)
    });
  },

  reportUser: async function(reportData) {
    return this.fetchWithAuth('/users/report', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  // Admin
  getAdminDashboard: async function() {
    return this.fetchWithAuth("/admin/dashboard");
  },

  getAdminCategories: async function() {
    return this.fetchWithAuth("/admin/categories");
  },

  createCategory: async function(categoryData) {
    return this.fetchWithAuth("/admin/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  updateCategory: async function(categoryId, categoryData) {
    return this.fetchWithAuth(`/admin/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async function(categoryId) {
    return this.fetchWithAuth(`/admin/categories/${categoryId}`, {
      method: "DELETE",
    });
  },

  getCurrentUserProfile: async function() {
    return this.fetchWithAuth("/users/profile");
  },

  updateProfile: function(userData) {
    return this.fetchWithAuth('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
};

// Exportar el objeto completo por defecto
export default apiService;

// Exportar funciones individuales
export const {
  login,
  register,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getCategories,
  getFavorites,
  addFavorite,
  removeFavorite,
  reportProduct,
  getUserProfile,
  getCurrentUser,
  updateUserProfile,
  changePassword,
  getUserById,
  rateUser,
  reportUser,
  getCurrentUserProfile,
  updateProfile
} = apiService;