// profile.js - Maneja la funcionalidad de la página de perfil
import apiService from "./api/apiService.js"
import { getUserData, isAuthenticated, removeToken } from "./api/tokenService.js"
import { showToast, truncateString } from "./utils.js"

// Variables globales
let isOwnProfile = true
let profileUserId = null

// Inicializar la página de perfil
async function initProfile() {
  // Verificar si el usuario está autenticado
  if (!isAuthenticated()) {
    window.location.href = "sign-in.html?redirect=profile.html"
    return
  }

  // Actualizar UI del navbar
  updateNavbarUI()

  // Obtener ID de usuario de la URL si existe
  const urlParams = new URLSearchParams(window.location.search)
  const userId = urlParams.get("id")

  // Determinar si es el perfil propio o de otro usuario
  if (userId) {
    const currentUser = getUserData()
    isOwnProfile = currentUser && currentUser.id === userId
    profileUserId = userId

    // Cargar perfil del usuario especificado
    await loadUserProfile(userId)
  } else {
    // Cargar perfil propio
    isOwnProfile = true
    await loadOwnProfile()
  }

  // Mostrar/ocultar elementos según si es perfil propio o ajeno
  updateProfileUI()

  // Configurar eventos
  setupProfileEvents()
}

// Actualizar UI del navbar según el estado de autenticación
function updateNavbarUI() {
  const userDropdown = document.getElementById('user-dropdown')
  const loginButtons = document.getElementById('login-buttons')
  const navbarUsername = document.getElementById('navbar-username')
  const navbarAvatar = document.getElementById('navbar-avatar')
  const logoutButton = document.getElementById('logout-button')

  if (isAuthenticated()) {
    const userData = getUserData()
    
    // Mostrar dropdown y ocultar botones de login
    if (userDropdown) userDropdown.style.display = 'block'
    if (loginButtons) loginButtons.style.display = 'none'
    
    // Actualizar nombre de usuario y avatar
    if (userData && navbarUsername) {
      navbarUsername.textContent = userData.name || 'Usuario'
    }
    if (userData && userData.avatarUrl && navbarAvatar) {
      navbarAvatar.src = userData.avatarUrl
    }

    // Configurar botón de logout
    if (logoutButton) {
      logoutButton.addEventListener('click', handleLogout)
    }
  } else {
    // Mostrar botones de login y ocultar dropdown
    if (userDropdown) userDropdown.style.display = 'none'
    if (loginButtons) loginButtons.style.display = 'block'
    
    // Redirigir a la página de login
    window.location.href = 'sign-in.html?redirect=profile.html'
  }
}

// Manejar cierre de sesión
function handleLogout(e) {
  e.preventDefault()
  removeToken()
  window.location.href = 'index.html'
}

// Cargar perfil propio
async function loadOwnProfile() {
  try {
    const profileData = await apiService.getUserProfile()
    profileUserId = profileData.id

    // Llenar formulario con datos del perfil
    const profileName = document.getElementById("profile-name")
    const profileEmail = document.getElementById("profile-email")
    const profilePhone = document.getElementById("profile-phone")
    const profileBio = document.getElementById("profile-bio")
    const userName = document.getElementById("user-name")
    const userEmail = document.getElementById("user-email")
    const productsCount = document.getElementById("products-count")
    const salesCount = document.getElementById("sales-count")
    const ratingValue = document.getElementById("rating-value")

    if (profileName) profileName.value = profileData.name || ""
    if (profileEmail) profileEmail.value = profileData.email || ""
    if (profilePhone) profilePhone.value = profileData.phone || ""
    if (profileBio) profileBio.value = profileData.bio || ""
    if (userName) userName.textContent = profileData.name || "Usuario"
    if (userEmail) userEmail.textContent = profileData.email || ""
    if (productsCount) productsCount.textContent = profileData.productsCount || "0"
    if (salesCount) salesCount.textContent = profileData.salesCount || "0"
    if (ratingValue) ratingValue.textContent = profileData.rating?.toFixed(1) || "0.0"

    // Cargar productos del usuario
    if (profileData.id) {
      await loadUserProducts(profileData.id)
    }
  } catch (error) {
    console.error("Error al cargar el perfil:", error)
    showToast("Error al cargar el perfil: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Cargar perfil de otro usuario
async function loadUserProfile(userId) {
  try {
    const profileData = await apiService.getUserById(userId)

    // Actualizar información en la tarjeta de perfil
    document.getElementById("user-name").textContent = profileData.name || "Usuario"
    document.getElementById("user-email").textContent = profileData.email || ""
    document.getElementById("user-bio").textContent = profileData.bio || "Este usuario no ha agregado una biografía."

    // Actualizar estadísticas
    document.getElementById("products-count").textContent = profileData.productsCount || "0"
    document.getElementById("sales-count").textContent = profileData.salesCount || "0"
    document.getElementById("rating-value").textContent = profileData.rating?.toFixed(1) || "0.0"

    // Actualizar valoración
    const ratingCount = profileData.ratingCount || 0
    document.getElementById("user-rating-count").textContent = `(${ratingCount} valoraciones)`

    // Generar estrellas de valoración
    generateRatingStars(profileData.rating, document.getElementById("user-rating-stars"))

    // Configurar botón de contacto
    if (profileData.phone) {
      document.getElementById("contact-user-btn").addEventListener("click", () => {
        const message = encodeURIComponent("Hola, te contacto desde UTTianguis.")
        window.open(`https://wa.me/52${profileData.phone}?text=${message}`, "_blank")
      })
    } else {
      document.getElementById("contact-user-btn").disabled = true
      document.getElementById("contact-user-btn").textContent = "No disponible"
    }

    // Cargar productos del usuario
    loadUserProducts(userId)
  } catch (error) {
    console.error("Error al cargar el perfil del usuario:", error)
    showToast("Error al cargar el perfil: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Cargar productos del usuario
async function loadUserProducts(userId) {
  try {
    const productsContainer = document.getElementById("user-products");
    if (!productsContainer) return;

    // Limpiar contenedor
    productsContainer.innerHTML = "";

    // Obtener productos
    const response = await apiService.getProducts({ userId });
    const products = Array.isArray(response) ? response : [];

    if (products.length === 0) {
      productsContainer.innerHTML = `
        <div class="text-center py-4">
          <p class="text-muted">No hay productos publicados</p>
        </div>
      `;
      return;
    }

    // Crear grid de productos de manera más eficiente
    const productsHTML = products
      .map(
        (product) => `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100">
          <img 
            src="${product.imageUrl || "images/placeholder.jpg"}" 
            class="card-img-top" 
            alt="${product.title}" 
            style="height: 200px; object-fit: cover;"
            loading="lazy"
          >
          <div class="card-body">
            <h5 class="card-title">${product.title || 'Sin título'}</h5>
            <p class="card-text text-primary fw-bold">$${(product.price || 0).toFixed(2)}</p>
            <p class="card-text small text-muted">${product.description ? truncateString(product.description, 100) : 'Sin descripción'}</p>
          </div>
          <div class="card-footer bg-white">
            <a href="product-detail.html?id=${product.id}" class="btn btn-outline-primary btn-sm">Ver detalles</a>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    productsContainer.innerHTML = `<div class="row g-4">${productsHTML}</div>`;
  } catch (error) {
    console.error("Error al cargar los productos:", error);
    const productsContainer = document.getElementById("user-products");
    if (productsContainer) {
      productsContainer.innerHTML = `
        <div class="alert alert-danger">
          Error al cargar los productos. Inténtalo de nuevo.
        </div>
      `;
    }
    showToast("Error al cargar los productos. Inténtalo de nuevo.", "error");
  }
}

// Actualizar UI según si es perfil propio o ajeno
function updateProfileUI() {
  // Usar clases CSS en lugar de manipular style directamente
  document.body.classList.toggle("viewing-own-profile", isOwnProfile)
  document.body.classList.toggle("viewing-other-profile", !isOwnProfile)

  // Para compatibilidad con el código existente, también actualizamos los estilos directamente
  document.querySelectorAll(".own-profile-only").forEach((el) => {
    el.style.display = isOwnProfile ? "block" : "none"
  })

  document.querySelectorAll(".other-profile-only").forEach((el) => {
    el.style.display = isOwnProfile ? "none" : "block"
  })
}

// Función para generar estrellas de valoración
function generateRatingStars(rating, container) {
  if (!container) return

  container.innerHTML = ""
  const fullRating = Math.floor(rating || 0)
  const hasHalfStar = (rating || 0) - fullRating >= 0.5

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("i")
    if (i <= fullRating) {
      star.className = "fas fa-star text-warning"
    } else if (i === fullRating + 1 && hasHalfStar) {
      star.className = "fas fa-star-half-alt text-warning"
    } else {
      star.className = "far fa-star text-warning"
    }
    star.setAttribute("aria-hidden", "true")
    container.appendChild(star)
  }

  // Añadir texto descriptivo para lectores de pantalla
  const srText = document.createElement("span")
  srText.className = "sr-only"
  srText.textContent = `Valoración: ${rating || 0} de 5 estrellas`
  container.appendChild(srText)
}

// Configurar eventos de la página de perfil
function setupProfileEvents() {
  // Formulario de información de perfil
  const profileInfoForm = document.getElementById("profile-info-form")
  if (profileInfoForm && isOwnProfile) {
    profileInfoForm.addEventListener("submit", handleProfileUpdate)
  }

  // Formulario de cambio de contraseña
  const changePasswordForm = document.getElementById("change-password-form")
  if (changePasswordForm && isOwnProfile) {
    changePasswordForm.addEventListener("submit", handlePasswordChange)
  }

  // Formulario de preferencias
  const preferencesForm = document.getElementById("preferences-form")
  if (preferencesForm && isOwnProfile) {
    preferencesForm.addEventListener("submit", handlePreferencesUpdate)
  }

  // Formulario de valoración de usuario
  const rateUserForm = document.getElementById("rate-user-form")
  if (rateUserForm && !isOwnProfile) {
    rateUserForm.addEventListener("submit", handleUserRating)
  }

  // Formulario de reporte de usuario
  const reportUserForm = document.getElementById("report-user-form")
  if (reportUserForm && !isOwnProfile) {
    reportUserForm.addEventListener("submit", handleUserReport)
  }

  // Cambio de avatar
  const changeAvatarBtn = document.getElementById("change-avatar-btn")
  const avatarUpload = document.getElementById("avatar-upload")

  if (changeAvatarBtn && avatarUpload && isOwnProfile) {
    changeAvatarBtn.addEventListener("click", () => {
      avatarUpload.click()
    })

    avatarUpload.addEventListener("change", handleAvatarChange)
  }
}

// Manejar actualización de perfil
async function handleProfileUpdate(e) {
  e.preventDefault()

  const name = document.getElementById("profile-name").value
  const phone = document.getElementById("profile-phone").value
  const bio = document.getElementById("profile-bio").value

  try {
    const profileData = {
      name,
      phone,
      bio,
    }

    await apiService.updateUserProfile(profileData)

    // Actualizar información en la tarjeta de perfil
    document.getElementById("user-name").textContent = name || "Usuario"

    // Mostrar mensaje de éxito
    showToast("Perfil actualizado correctamente")
  } catch (error) {
    console.error("Error al actualizar el perfil:", error)
    showToast("Error al actualizar el perfil: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Manejar cambio de contraseña
async function handlePasswordChange(e) {
  e.preventDefault()

  const currentPassword = document.getElementById("current-password").value
  const newPassword = document.getElementById("new-password").value
  const confirmPassword = document.getElementById("confirm-password").value

  // Validar que las contraseñas coincidan
  if (newPassword !== confirmPassword) {
    showToast("Las contraseñas no coinciden", "error")
    return
  }

  try {
    await apiService.changePassword(currentPassword, newPassword)

    // Limpiar formulario
    const form = document.getElementById("change-password-form")
    if (form) form.reset()

    // Mostrar mensaje de éxito
    showToast("Contraseña actualizada correctamente")
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error)
    showToast("Error al cambiar la contraseña: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Manejar actualización de preferencias
async function handlePreferencesUpdate(e) {
  e.preventDefault()

  const emailNotifications = document.getElementById("email-notifications").checked
  const newProductNotifications = document.getElementById("new-product-notifications").checked
  const messageNotifications = document.getElementById("message-notifications").checked
  const profileVisibility = document.getElementById("profile-visibility").checked
  const contactInfoVisibility = document.getElementById("contact-info-visibility").checked

  try {
    const preferencesData = {
      preferences: {
        emailNotifications,
        newProductNotifications,
        messageNotifications,
        profileVisibility,
        contactInfoVisibility,
      },
    }

    await apiService.updateUserProfile(preferencesData)

    // Mostrar mensaje de éxito
    showToast("Preferencias actualizadas correctamente")
  } catch (error) {
    console.error("Error al actualizar las preferencias:", error)
    showToast("Error al actualizar las preferencias: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Manejar valoración de usuario
async function handleUserRating(e) {
  e.preventDefault()

  const ratingValue = document.querySelector('input[name="rating"]:checked')?.value
  const comment = document.getElementById("rating-comment").value

  if (!ratingValue) {
    showToast("Debes seleccionar una valoración", "error")
    return
  }

  try {
    const ratingData = {
      rating: Number.parseInt(ratingValue),
      comment,
    }

    await apiService.rateUser(profileUserId, ratingData)

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("rate-user-modal"))
    modal.hide()

    // Mostrar mensaje de éxito
    showToast("Valoración enviada correctamente")

    // Recargar perfil para actualizar valoración
    await loadUserProfile(profileUserId)
  } catch (error) {
    console.error("Error al enviar la valoración:", error)
    showToast("Error al enviar la valoración: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Manejar reporte de usuario
async function handleUserReport(e) {
  e.preventDefault()

  const reason = document.getElementById("report-reason").value
  const details = document.getElementById("report-details").value

  if (!reason) {
    showToast("Debes seleccionar un motivo", "error")
    return
  }

  try {
    const reportData = {
      userId: profileUserId,
      reason,
      details,
    }

    await apiService.reportUser(reportData)

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("report-user-modal"))
    modal.hide()

    // Limpiar formulario
    document.getElementById("report-user-form").reset()

    // Mostrar mensaje de éxito
    showToast("Reporte enviado correctamente")
  } catch (error) {
    console.error("Error al enviar el reporte:", error)
    showToast("Error al enviar el reporte: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Manejar cambio de avatar
async function handleAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return

  // Constantes para validación
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const VALID_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

  // Validar tipo de archivo
  if (!VALID_TYPES.includes(file.type)) {
    showToast("Formato de imagen no válido. Usa JPG, PNG, GIF o WebP", "error")
    return
  }

  // Validar tamaño
  if (file.size > MAX_SIZE) {
    showToast("La imagen es demasiado grande. Máximo 5MB", "error")
    return
  }

  try {
    // Mostrar indicador de carga
    const profileImage = document.getElementById("profile-image")
    const originalSrc = profileImage.src
    profileImage.classList.add("opacity-50")

    // Crear FormData para enviar el archivo
    const formData = new FormData()
    formData.append("avatar", file)

    // Actualizar avatar
    const response = await fetch(`${apiService.API_URL}/users/avatar`, {
      method: "POST",
      headers: {
        "X-API-Key": apiService.getToken(),
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Error al subir la imagen")
    }

    const data = await response.json()

    // Actualizar imagen en la página
    profileImage.src = data.avatarUrl
    profileImage.classList.remove("opacity-50")

    // Mostrar mensaje de éxito
    showToast("Avatar actualizado correctamente")
  } catch (error) {
    const profileImage = document.getElementById("profile-image")
    const originalSrc = profileImage.src
    console.error("Error al cambiar el avatar:", error)
    // Restaurar imagen original en caso de error
    if (originalSrc) profileImage.src = originalSrc
    profileImage.classList.remove("opacity-50")
    showToast("Error al cambiar el avatar: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

// Inicializar la página cuando se carga el DOM
document.addEventListener("DOMContentLoaded", initProfile)

