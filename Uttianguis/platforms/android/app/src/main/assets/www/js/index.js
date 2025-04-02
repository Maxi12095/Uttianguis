import apiService from "./api/apiService.js"
import tokenService from "./api/tokenService.js"
import { showToast, updateNavigation } from "./auth.js"

/**
 * Initialize home page
 * @returns {Promise<void>}
 */
export async function initHomePage() {
  try {
    // Actualizar navegación según estado de autenticación
    updateNavigation()

    // Load featured products
    await loadFeaturedProducts()
  } catch (error) {
    console.error("Error initializing home page:", error)
    showToast("Error al cargar la página principal", "error")
  }
}

/**
 * Load featured products from API
 * @returns {Promise<void>}
 */
async function loadFeaturedProducts() {
  const featuredProductsContainer = document.getElementById("featured-products")

  if (!featuredProductsContainer) return

  try {
    // Show loading spinner
    featuredProductsContainer.innerHTML = `
      <div class="col-12 text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    `

    // Get featured products
    const products = await apiService.getFeaturedProducts()

    // Clear loading spinner
    featuredProductsContainer.innerHTML = ""

    // Check if no products
    if (!products || products.length === 0) {
      featuredProductsContainer.innerHTML = `
        <div class="col-12 text-center py-4">
          <p class="text-muted">No hay productos destacados disponibles</p>
        </div>
      `
      return
    }

    // Tomar solo los primeros 4 productos (por si acaso la API retorna más)
    const featuredProducts = products.slice(0, 4)
    
    // Render products
    renderProducts(featuredProducts, featuredProductsContainer)

    // Set up favorite buttons
    setupFavoriteButtons()
  } catch (error) {
    console.error("Error loading featured products:", error)
    featuredProductsContainer.innerHTML = `
      <div class="col-12 text-center py-4">
        <p class="text-muted">Error al cargar los productos destacados</p>
      </div>
    `
  }
}

/**
 * Render products in the specified container
 * @param {Array} products - Array of product objects
 * @param {HTMLElement} container - Container element to render products in
 */
function renderProducts(products, container) {
  products.forEach((product) => {
    const col = document.createElement("div")
    col.className = "col-md-6 col-lg-3"

    col.innerHTML = `
      <div class="card h-100 product-card">
        <div class="position-relative">
          <!-- Temporalmente ocultamos la imagen hasta tener el sistema de imágenes listo -->
          <!--
          <img src="${product.mainImageUrl}" 
               class="card-img-top" 
               alt="${product.title}" 
               style="height: 200px; object-fit: cover;">
          -->
          <div class="bg-light" style="height: 200px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-image text-muted fa-3x"></i>
          </div>
          ${product.isSold ? '<div class="badge bg-danger position-absolute top-0 start-0 m-2">Vendido</div>' : ""}
          <button class="btn btn-sm position-absolute top-0 end-0 m-2 favorite-btn ${product.isFavorite ? "favorited" : ""}" data-product-id="${product.id}">
            <i class="fa${product.isFavorite ? "s" : "r"} fa-heart"></i>
          </button>
        </div>
        <div class="card-body">
          <h5 class="card-title">${product.title}</h5>
          <p class="card-text text-primary fw-bold">$${product.price.toFixed(2)}</p>
          <div class="d-flex justify-content-between align-items-center">
            <span class="badge bg-secondary">${product.categoryName}</span>
            <small class="text-muted">${formatDate(new Date(product.createdAt))}</small>
          </div>
        </div>
        <div class="card-footer bg-white">
          <a href="product-details.html?id=${product.id}" class="btn btn-outline-primary w-100">Ver detalles</a>
        </div>
      </div>
    `

    container.appendChild(col)
  })
}

/**
 * Set up favorite buttons
 */
function setupFavoriteButtons() {
  const favoriteButtons = document.querySelectorAll(".favorite-btn")

  favoriteButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault()

      if (!tokenService.isAuthenticated()) {
        showToast("Debes iniciar sesión para agregar favoritos", "error")
        return
      }

      const productId = button.dataset.productId
      const isFavorited = button.classList.contains("favorited")

      try {
        if (isFavorited) {
          await apiService.removeFavorite(productId)
          button.classList.remove("favorited")
          button.querySelector("i").className = "far fa-heart"
          showToast("Producto eliminado de favoritos", "success")
        } else {
          await apiService.addFavorite(productId)
          button.classList.add("favorited")
          button.querySelector("i").className = "fas fa-heart"
          showToast("Producto agregado a favoritos", "success")
        }
      } catch (error) {
        console.error("Error toggling favorite:", error)
        showToast("Error al actualizar favoritos", "error")
      }
    })
  })
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date || isNaN(date.getTime())) {
    return "Fecha desconocida"
  }

  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Hoy"
  } else if (diffDays === 1) {
    return "Ayer"
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`
  } else {
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
}

// Initialize home page when DOM is loaded
document.addEventListener("DOMContentLoaded", initHomePage)

