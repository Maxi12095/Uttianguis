// favorites.js - Maneja la funcionalidad de la página de favoritos
import apiService from "./api/apiService.js"
import { isAuthenticated } from "./api/tokenService.js"
import { showToast, formatDate } from "./utils.js" // Importar funciones comunes desde utils.js

// Inicializar la página de favoritos
async function initFavorites() {
  // Verificar si el usuario está autenticado
  if (!isAuthenticated()) {
    window.location.href = "sign-in.html?redirect=favorites.html"
    return
  }

  // Cargar favoritos
  await loadFavorites()
}

// Cargar productos favoritos
async function loadFavorites() {
  const favoritesContainer = document.getElementById("favorites-container")
  const emptyFavorites = document.getElementById("empty-favorites")

  if (!favoritesContainer || !emptyFavorites) {
    console.error("No se encontraron los elementos necesarios en el DOM")
    return
  }

  try {
    // Mostrar indicador de carga
    favoritesContainer.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    `

    const favorites = await apiService.getFavorites()
    console.log("Favoritos recibidos:", favorites)

    // Limpiar contenedor
    favoritesContainer.innerHTML = ""

    if (!Array.isArray(favorites) || favorites.length === 0) {
      // Mostrar estado vacío
      favoritesContainer.innerHTML = `
        <div class="text-center py-5">
          <div class="mb-4">
            <i class="fas fa-heart text-muted" style="font-size: 4rem;"></i>
          </div>
          <h3 class="h4 mb-3">No tienes productos favoritos</h3>
          <p class="text-muted mb-4">Explora el marketplace y marca productos como favoritos para verlos aquí</p>
          <a href="index.html" class="btn btn-primary">
            <i class="fas fa-search me-2"></i>Explorar productos
          </a>
        </div>
      `
      return
    }

    // Crear tarjetas de productos
    const productsHTML = favorites.map((product) => createProductCard(product)).join("")
    favoritesContainer.innerHTML = `<div class="row g-4">${productsHTML}</div>`

    // Configurar eventos de botones de eliminar favorito
    document.querySelectorAll(".remove-favorite").forEach((button) => {
      button.addEventListener("click", handleRemoveFavorite)
    })
  } catch (error) {
    console.error("Error al cargar favoritos:", error)
    favoritesContainer.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <p class="mb-0">Error al cargar favoritos: ${error.message || "Inténtalo de nuevo"}</p>
          <button class="btn btn-outline-danger mt-2" onclick="window.location.reload()">
            <i class="fas fa-sync-alt"></i> Reintentar
          </button>
        </div>
      </div>
    `
    showToast("Error al cargar favoritos: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Crear tarjeta de producto
function createProductCard(product) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 product-card">
        <div class="position-relative">
          <img src="${product.imageUrl || "images/placeholder.jpg"}" class="card-img-top" 
               alt="${product.title || 'Producto'}" style="height: 200px; object-fit: cover;">
          <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 remove-favorite" 
                  data-id="${product.id}" aria-label="Eliminar de favoritos">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="card-body">
          <h5 class="card-title">${product.title || 'Sin título'}</h5>
          <p class="card-text text-primary fw-bold">$${(product.price || 0).toFixed(2)}</p>
          <p class="card-text small text-muted">${truncateText(product.description || '', 100)}</p>
        </div>
        <div class="card-footer bg-white">
          <div class="d-flex justify-content-between align-items-center">
            <a href="product-detail.html?id=${product.id}" class="btn btn-outline-primary">Ver detalles</a>
            <small class="text-muted">${formatDate(new Date(product.createdAt))}</small>
          </div>
        </div>
      </div>
    </div>
  `
}

// Truncar texto con una longitud máxima
function truncateText(text, maxLength) {
  if (!text) return ""
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

// Manejar eliminación de favorito
async function handleRemoveFavorite(e) {
  const productId = e.currentTarget.dataset.id
  if (!productId) return

  try {
    await apiService.removeFavorite(productId)

    // Eliminar tarjeta del DOM con animación
    const card = e.currentTarget.closest(".product-card")
    const col = card.parentElement

    card.style.transition = "all 0.3s ease"
    card.style.opacity = "0"
    card.style.transform = "scale(0.8)"

    setTimeout(() => {
      col.remove()

      // Verificar si quedan favoritos
      if (document.querySelectorAll(".product-card").length === 0) {
        // Mostrar estado vacío
        const favoritesContainer = document.getElementById("favorites-container")
        if (favoritesContainer) {
          favoritesContainer.innerHTML = `
            <div class="text-center py-5">
              <div class="mb-4">
                <i class="fas fa-heart text-muted" style="font-size: 4rem;"></i>
              </div>
              <h3 class="h4 mb-3">No tienes productos favoritos</h3>
              <p class="text-muted mb-4">Explora el marketplace y marca productos como favoritos para verlos aquí</p>
              <a href="index.html" class="btn btn-primary">
                <i class="fas fa-search me-2"></i>Explorar productos
              </a>
            </div>
          `
        }
      }
    }, 300)

    // Mostrar mensaje de éxito
    showToast("Producto eliminado de favoritos")
  } catch (error) {
    console.error("Error al eliminar favorito:", error)
    showToast("Error al eliminar favorito: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Inicializar la página cuando se carga el DOM
document.addEventListener("DOMContentLoaded", initFavorites)

