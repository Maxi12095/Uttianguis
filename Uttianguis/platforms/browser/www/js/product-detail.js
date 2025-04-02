// product-detail.js - Maneja la funcionalidad de la página de detalle de producto
import apiService from "./api/apiService.js"
import { isAuthenticated } from "./api/tokenService.js"
import { showToast, formatDate } from "./utils.js"

// Variables globales
let productData = null
let isFavorite = false

// Initialize product detail page
async function initProductDetailPage() {
  try {
    // Obtener ID del producto de la URL
    const urlParams = new URLSearchParams(window.location.search)
    const productId = urlParams.get("id")

    if (!productId) {
      window.location.href = "marketplace.html"
      return
    }

    // Mostrar indicador de carga
    const contentElement = document.querySelector(".product-detail-content")
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="text-center p-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando detalles del producto...</p>
        </div>
      `
    }

    // Cargar detalles del producto
    await loadProductDetail(productId)

    // Configurar eventos
    setupProductDetailEvents()
  } catch (error) {
    handleError(error, "Error al inicializar página de detalle")
  }
}

// Cargar detalles del producto
async function loadProductDetail(productId) {
  try {
    console.log("Cargando detalles del producto:", productId)
    productData = await apiService.getProductById(productId)
    console.log("Datos del producto cargados:", productData)

    // Guardar datos del producto en el elemento oculto
    const productDataElement = document.getElementById("product-data")
    if (productDataElement) {
      productDataElement.dataset.id = productData.id
      productDataElement.dataset.category = productData.category
    }

    // Actualizar título y descripción
    document.title = `${productData.title} - UTTianguis`
    const titleElement = document.querySelector(".product-title")
    if (titleElement) titleElement.textContent = productData.title

    const priceElement = document.querySelector(".product-price")
    if (priceElement) priceElement.textContent = `$${productData.price.toFixed(2)}`

    const descriptionElement = document.querySelector(".product-description p")
    if (descriptionElement) descriptionElement.textContent = productData.description

    // Actualizar categoría y fecha
    const categoryElement = document.querySelector(".product-category")
    if (categoryElement) {
      categoryElement.innerHTML = `<i class="fas fa-tag"></i> ${getCategoryName(productData.category)}`
    }

    const dateElement = document.querySelector(".product-date")
    if (dateElement) {
      dateElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(new Date(productData.createdAt))}`
    }

    // Actualizar breadcrumb
    const categoryBreadcrumb = document.querySelector(".breadcrumb .category")
    if (categoryBreadcrumb) {
      categoryBreadcrumb.textContent = getCategoryName(productData.category)
      categoryBreadcrumb.href = `marketplace.html?category=${productData.category}`
    }

    // Cargar imágenes
    loadProductImages(productData.images)

    // Cargar información del vendedor
    loadSellerInfo(productData.seller)

    // Verificar si el producto está en favoritos
    if (isAuthenticated()) {
      await checkFavoriteStatus()
    }
  } catch (error) {
    console.error("Error al cargar detalles del producto:", error)
    const contentElement = document.querySelector(".product-detail-content")
    if (contentElement) {
      contentElement.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar el producto. Inténtalo de nuevo.
            </div>
        `
    }
  }
}

// Cargar imágenes del producto
function loadProductImages(images) {
  const imagesContainer = document.getElementById("product-images")
  if (!imagesContainer) return

  imagesContainer.innerHTML = ""

  if (!images || images.length === 0) {
    // Mostrar imagen por defecto
    imagesContainer.innerHTML = `
      <div class="swiper-slide product-image-slide">
        <img src="img/icono.jpg" alt="Imagen no disponible" class="product-image" loading="lazy">
      </div>
    `
    return
  }

  // Crear slides para cada imagen de manera más eficiente
  imagesContainer.innerHTML = images
    .map(
      (image) => `
    <div class="swiper-slide product-image-slide">
      <img src="${image.url}" alt="${productData?.title || "Producto"}" class="product-image" loading="lazy">
    </div>
  `,
    )
    .join("")

  // Inicializar Swiper
  const swiper = new Swiper(".product-images-slider", {
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    lazy: {
      loadPrevNext: true,
    },
  })
}

// Cargar información del vendedor
function loadSellerInfo(seller) {
  if (!seller) return

  // Actualizar todos los elementos relacionados con el vendedor de manera más eficiente
  const sellerElements = {
    name: document.getElementById("seller-name"),
    rating: document.getElementById("seller-rating"),
    ratingCount: document.getElementById("rating-count"),
    avatar: document.getElementById("seller-avatar"),
    profileLink: document.getElementById("seller-profile-link"),
    contactButton: document.getElementById("contact-seller"),
  }

  // Actualizar texto y atributos
  if (sellerElements.name) sellerElements.name.textContent = seller.name
  if (sellerElements.rating) sellerElements.rating.textContent = seller.rating?.toFixed(1) || "0.0"
  if (sellerElements.ratingCount) sellerElements.ratingCount.textContent = `(${seller.ratingCount || 0})`
  if (sellerElements.avatar) {
    sellerElements.avatar.src = seller.avatarUrl || "img/icono.jpg"
    sellerElements.avatar.alt = `Avatar de ${seller.name}`
  }
  if (sellerElements.profileLink) {
    sellerElements.profileLink.href = `profile.html?id=${seller.id}`
    sellerElements.profileLink.setAttribute("aria-label", `Ver perfil de ${seller.name}`)
  }

  // Configurar botón de contacto
  if (sellerElements.contactButton) {
    sellerElements.contactButton.addEventListener("click", () => {
      if (!isAuthenticated()) {
        showToast("Debes iniciar sesión para contactar al vendedor", "error")
        return
      }

      if (seller.phone) {
        const message = encodeURIComponent(
          `Hola, estoy interesado en tu producto "${productData.title}" que vi en UTTianguis. ¿Está disponible?`,
        )
        window.open(`https://wa.me/52${seller.phone}?text=${message}`, "_blank")
      } else {
        showToast("El vendedor no ha proporcionado un número de contacto", "error")
      }
    })
  }
}

// Verificar si el producto está en favoritos
async function checkFavoriteStatus() {
  try {
    const favorites = await apiService.getFavorites()
    isFavorite = favorites.some((fav) => fav.id === productData.id)

    // Actualizar botón de favoritos
    const favoriteButton = document.getElementById("favorite-button")
    if (favoriteButton) {
      if (isFavorite) {
        favoriteButton.innerHTML = '<i class="fas fa-heart"></i>'
        favoriteButton.classList.add("active")
      } else {
        favoriteButton.innerHTML = '<i class="far fa-heart"></i>'
        favoriteButton.classList.remove("active")
      }
    }
  } catch (error) {
    console.error("Error al verificar estado de favorito:", error)
  }
}

// Configurar eventos de la página
function setupProductDetailEvents() {
  // Botón de favoritos
  const favoriteButton = document.getElementById("favorite-button")
  if (favoriteButton) {
    favoriteButton.addEventListener("click", handleFavoriteToggle)
  }

  // Botón de compartir
  const shareButton = document.getElementById("share-button")
  if (shareButton) {
    shareButton.addEventListener("click", handleShare)
  }

  // Botón de reportar
  const reportButton = document.getElementById("report-button")
  if (reportButton) {
    reportButton.addEventListener("click", handleReportClick)
  }

  // Formulario de reporte
  const reportForm = document.getElementById("report-form")
  if (reportForm) {
    reportForm.addEventListener("submit", handleReportSubmit)
  }

  // Botón de cerrar modal
  const closeModalButton = document.querySelector(".close-modal")
  if (closeModalButton) {
    closeModalButton.addEventListener("click", () => {
      const reportModal = document.getElementById("report-modal")
      if (reportModal) reportModal.classList.remove("show")
    })
  }

  // Botón de cancelar reporte
  const cancelReportButton = document.querySelector(".cancel-report")
  if (cancelReportButton) {
    cancelReportButton.addEventListener("click", () => {
      const reportModal = document.getElementById("report-modal")
      if (reportModal) reportModal.classList.remove("show")
    })
  }
}

// Manejar toggle de favoritos
async function handleFavoriteToggle() {
  if (!isAuthenticated()) {
    showToast("Debes iniciar sesión para añadir favoritos", "error")
    return
  }

  const favoriteButton = document.getElementById("favorite-button")
  if (!favoriteButton) return

  try {
    if (isFavorite) {
      // Eliminar de favoritos
      await apiService.removeFavorite(productData.id)
      favoriteButton.innerHTML = '<i class="far fa-heart"></i>'
      favoriteButton.classList.remove("active")
      isFavorite = false
      showToast("Producto eliminado de favoritos")
    } else {
      // Añadir a favoritos
      await apiService.addFavorite(productData.id)
      favoriteButton.innerHTML = '<i class="fas fa-heart"></i>'
      favoriteButton.classList.add("active")
      isFavorite = true
      showToast("Producto añadido a favoritos")
    }
  } catch (error) {
    console.error("Error al actualizar favorito:", error)
    showToast("Error al actualizar favorito: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Manejar compartir
function handleShare() {
  if (navigator.share) {
    navigator.share({
      title: productData.title,
      text: productData.description,
      url: window.location.href,
    })
  } else {
    // Fallback para navegadores que no soportan Web Share API
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast("Enlace copiado al portapapeles")
    })
  }
}

// Manejar click en botón de reportar
function handleReportClick() {
  if (!isAuthenticated()) {
    showToast("Debes iniciar sesión para reportar un producto", "error")
    return
  }

  const reportModal = document.getElementById("report-modal")
  if (reportModal) {
    reportModal.classList.add("show")
  }
}

// Manejar envío de reporte
async function handleReportSubmit(e) {
  e.preventDefault()

  const reasonSelect = document.getElementById("report-reason")
  const descriptionTextarea = document.getElementById("report-description")
  const screenshotInput = document.getElementById("report-screenshot")

  if (!reasonSelect || !descriptionTextarea) return

  const reason = reasonSelect.value
  const description = descriptionTextarea.value

  if (!reason || !description) {
    showToast("Por favor, completa todos los campos requeridos", "error")
    return
  }

  try {
    const reportData = {
      reason,
      description,
      productId: productData.id,
    }

    // Si hay una captura de pantalla, procesarla
    if (screenshotInput && screenshotInput.files.length > 0) {
      const file = screenshotInput.files[0]
      // Aquí podrías implementar la lógica para subir la imagen
      // Por ahora solo incluimos el nombre del archivo
      reportData.screenshot = file.name
    }

    await apiService.reportProduct(productData.id, reportData)
    showToast("Reporte enviado correctamente")

    // Cerrar modal
    const reportModal = document.getElementById("report-modal")
    if (reportModal) {
      reportModal.classList.remove("show")
    }

    // Limpiar formulario
    if (reasonSelect) reasonSelect.value = ""
    if (descriptionTextarea) descriptionTextarea.value = ""
    if (screenshotInput) screenshotInput.value = ""
  } catch (error) {
    console.error("Error al enviar reporte:", error)
    showToast("Error al enviar reporte: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Función auxiliar para obtener nombre de categoría
function getCategoryName(categoryKey) {
  const categories = {
    electronics: "Electrónicos",
    books: "Libros",
    clothing: "Ropa",
    food: "Comida/Lunches",
    tutoring: "Tutoría/Ayuda para tareas",
    sports: "Deportes",
    music: "Instrumentos musicales",
    school: "Material escolar",
    videogames: "Videojuegos",
    transport: "Transporte/Rides",
    events: "Eventos/Boletos",
    other: "Otros",
  }
  return categories[categoryKey] || categoryKey
}

// Función para manejar errores de manera consistente
function handleError(error, message = "Ha ocurrido un error") {
  console.error(error)
  showToast(`${message}: ${error.message || "Inténtalo de nuevo"}`, "error")
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", initProductDetailPage)

