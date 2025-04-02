/**
 * Componente para mostrar los detalles de un producto
 */
;(() => {
  // Dependencias
  const { apiGet } = window.ApiService
  const { showToast, formatDate, formatPrice } = window.Utils
  const { isAuthenticated, getCurrentUser } = window.UserService
  const { contactSellerViaWhatsApp } = window.ContactService
  const AppConfig = window.AppConfig // Accessing AppConfig from window

  // Elementos del DOM
  let productContainer
  let productImageGallery
  let productTitle
  let productPrice
  let productDescription
  let productCondition
  let productCategory
  let productSeller
  let productDate
  let contactButton
  let favoriteButton
  let backButton

  // Variables de estado
  let currentProduct = null
  let currentUser = null
  let isFavorite = false

  /**
   * Inicializa el componente
   */
  function init() {
    // Obtener elementos del DOM
    productContainer = document.getElementById("product-detail-container")
    productImageGallery = document.getElementById("product-image-gallery")
    productTitle = document.getElementById("product-title")
    productPrice = document.getElementById("product-price")
    productDescription = document.getElementById("product-description")
    productCondition = document.getElementById("product-condition")
    productCategory = document.getElementById("product-category")
    productSeller = document.getElementById("product-seller")
    productDate = document.getElementById("product-date")
    contactButton = document.getElementById("contact-seller-button")
    favoriteButton = document.getElementById("favorite-button")
    backButton = document.getElementById("back-button")

    // Configurar eventos
    backButton.addEventListener("click", goBack)
    contactButton.addEventListener("click", contactSeller)
    favoriteButton.addEventListener("click", toggleFavorite)

    // Cargar producto
    loadProductDetails()

    // Verificar si el usuario está autenticado
    if (isAuthenticated()) {
      getCurrentUser()
        .then((user) => {
          currentUser = user
          checkIfFavorite()
        })
        .catch((error) => {
          console.error("Error al obtener usuario actual:", error)
        })
    }
  }

  /**
   * Carga los detalles del producto
   */
  async function loadProductDetails() {
    try {
      // Obtener ID del producto de la URL
      const urlParams = new URLSearchParams(window.location.search)
      const productId = urlParams.get("id")

      if (!productId) {
        showToast("ID de producto no especificado", "error")
        goBack()
        return
      }

      // Mostrar indicador de carga
      productContainer.innerHTML = '<div class="loading-spinner"></div>'

      // Obtener detalles del producto
      currentProduct = await apiGet(`/products/${productId}`)

      // Actualizar vistas del producto
      await apiGet(`/products/${productId}/view`)

      // Renderizar detalles del producto
      renderProductDetails()
    } catch (error) {
      showToast("Error al cargar el producto: " + error.message, "error")
      productContainer.innerHTML = '<div class="error-message">No se pudo cargar el producto</div>'
    }
  }

  /**
   * Renderiza los detalles del producto
   */
  function renderProductDetails() {
    if (!currentProduct) return

    // Actualizar título y precio
    productTitle.textContent = currentProduct.title
    productPrice.textContent = formatPrice(currentProduct.price)

    // Actualizar descripción
    productDescription.textContent = currentProduct.description || "Sin descripción"

    // Actualizar condición
    const conditionObj = AppConfig.conditions.find((c) => c.id === currentProduct.condition)
    productCondition.textContent = conditionObj ? conditionObj.name : currentProduct.condition

    // Actualizar categoría
    const categoryObj = AppConfig.categories.find((c) => c.id === currentProduct.category_id)
    productCategory.textContent = categoryObj ? categoryObj.name : "Sin categoría"

    // Actualizar información del vendedor
    productSeller.textContent = currentProduct.seller ? currentProduct.seller.name : "Usuario desconocido"
    productSeller.dataset.userId = currentProduct.user_id

    // Actualizar fecha
    productDate.textContent = formatDate(currentProduct.created_at)

    // Renderizar galería de imágenes
    renderImageGallery()

    // Actualizar botón de contacto
    updateContactButton()

    // Mostrar el contenedor del producto
    productContainer.classList.remove("loading")
  }

  /**
   * Renderiza la galería de imágenes del producto
   */
  function renderImageGallery() {
    // Limpiar galería
    productImageGallery.innerHTML = ""

    // Verificar si hay imágenes
    if (!currentProduct.images || currentProduct.images.length === 0) {
      // Mostrar imagen por defecto
      const defaultImage = document.createElement("div")
      defaultImage.className = "product-image active"
      defaultImage.innerHTML = `<img src="${AppConfig.defaultProductImage}" alt="${currentProduct.title}">`
      productImageGallery.appendChild(defaultImage)
      return
    }

    // Ordenar imágenes (primaria primero)
    const sortedImages = [...currentProduct.images].sort((a, b) => {
      if (a.is_primary) return -1
      if (b.is_primary) return 1
      return a.display_order - b.display_order
    })

    // Crear elementos para cada imagen
    sortedImages.forEach((image, index) => {
      const imageElement = document.createElement("div")
      imageElement.className = `product-image ${index === 0 ? "active" : ""}`
      imageElement.innerHTML = `<img src="${image.image_url}" alt="${currentProduct.title} - Imagen ${index + 1}">`
      imageElement.addEventListener("click", () => {
        // Activar imagen al hacer clic
        document.querySelectorAll(".product-image").forEach((el) => el.classList.remove("active"))
        imageElement.classList.add("active")
      })
      productImageGallery.appendChild(imageElement)
    })
  }

  /**
   * Actualiza el botón de contacto según el estado del producto
   */
  function updateContactButton() {
    // Verificar si el producto está disponible
    if (currentProduct.status !== "available") {
      contactButton.disabled = true
      contactButton.textContent = "No disponible"
      return
    }

    // Verificar si el usuario actual es el vendedor
    if (currentUser && currentUser.id === currentProduct.user_id) {
      contactButton.disabled = true
      contactButton.textContent = "Eres el vendedor"
      return
    }

    // Habilitar botón de contacto
    contactButton.disabled = false
    contactButton.textContent = "Contactar por WhatsApp"
  }

  /**
   * Contacta al vendedor vía WhatsApp
   */
  function contactSeller() {
    // Verificar si hay un producto cargado
    if (!currentProduct || !currentProduct.seller) {
      showToast("No se puede contactar al vendedor en este momento", "error")
      return
    }

    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
      showToast("Debes iniciar sesión para contactar al vendedor", "error")
      window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href)
      return
    }

    // Contactar al vendedor vía WhatsApp
    contactSellerViaWhatsApp(currentProduct.seller.phone, currentProduct.title)
  }

  /**
   * Verifica si el producto está en favoritos
   */
  async function checkIfFavorite() {
    if (!currentUser || !currentProduct) return

    try {
      const response = await apiGet(`/favorites/check/${currentProduct.id}`)
      isFavorite = response.isFavorite
      updateFavoriteButton()
    } catch (error) {
      console.error("Error al verificar favorito:", error)
    }
  }

  /**
   * Actualiza el estado del botón de favoritos
   */
  function updateFavoriteButton() {
    if (isFavorite) {
      favoriteButton.classList.add("active")
      favoriteButton.innerHTML = '<i class="bx bxs-heart"></i>'
    } else {
      favoriteButton.classList.remove("active")
      favoriteButton.innerHTML = '<i class="bx bx-heart"></i>'
    }
  }

  /**
   * Alterna el estado de favorito del producto
   */
  async function toggleFavorite() {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
      showToast("Debes iniciar sesión para agregar a favoritos", "error")
      window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href)
      return
    }

    try {
      if (isFavorite) {
        await apiGet(`/favorites/remove/${currentProduct.id}`)
        isFavorite = false
        showToast("Eliminado de favoritos", "success")
      } else {
        await apiGet(`/favorites/add/${currentProduct.id}`)
        isFavorite = true
        showToast("Agregado a favoritos", "success")
      }
      updateFavoriteButton()
    } catch (error) {
      showToast("Error al actualizar favoritos: " + error.message, "error")
    }
  }

  /**
   * Regresa a la página anterior
   */
  function goBack() {
    window.history.back()
  }

  // Inicializar cuando el DOM esté listo
  document.addEventListener("DOMContentLoaded", init)

  // Inicializar cuando Cordova esté listo
  document.addEventListener("deviceready", init)
})()

