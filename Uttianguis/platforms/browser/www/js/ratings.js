// Servicio para gestionar valoraciones de usuarios
import { apiService } from "./api/apiService.js"
import { tokenService } from "./api/tokenService.js"

class RatingManager {
  constructor() {
    this.currentRating = 0
    this.targetUserId = null
    this.userRatings = {}
  }

  // Inicializar el gestor de valoraciones
  initialize() {
    if (!tokenService.getToken()) {
      // No es necesario redirigir, ya que las valoraciones pueden ser visibles para usuarios no autenticados
      this.isAuthenticated = false
    } else {
      this.isAuthenticated = true
    }

    this.setupEventListeners()
  }

  // Configurar event listeners
  setupEventListeners() {
    // Event listener para botones de valoración en la página
    document.addEventListener("click", (event) => {
      // Botón de valorar usuario
      if (event.target.closest(".rate-user-btn")) {
        if (!this.isAuthenticated) {
          this.showToast("Debes iniciar sesión para valorar a un usuario", "warning")
          return
        }

        const userId = event.target.closest(".rate-user-btn").dataset.userId
        this.openRatingModal(userId)
      }
    })

    // Event listener para el modal de valoración
    document.addEventListener("DOMContentLoaded", () => {
      // Botón de cerrar modal
      const closeModalBtn = document.getElementById("close-rating-modal")
      if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
          this.closeRatingModal()
        })
      }

      // Botón de enviar valoración
      const submitRatingBtn = document.getElementById("submit-rating-btn")
      if (submitRatingBtn) {
        submitRatingBtn.addEventListener("click", () => {
          this.submitRating()
        })
      }

      // Botón de cancelar valoración
      const cancelRatingBtn = document.getElementById("cancel-rating-btn")
      if (cancelRatingBtn) {
        cancelRatingBtn.addEventListener("click", () => {
          this.closeRatingModal()
        })
      }
    })
  }

  // Abrir modal de valoración
  openRatingModal(userId) {
    this.targetUserId = userId
    this.currentRating = 0

    const ratingModal = document.getElementById("rating-modal")
    if (!ratingModal) {
      this.createRatingModal()
    }

    // Mostrar el modal
    document.getElementById("rating-modal").classList.add("show")

    // Resetear las estrellas
    this.updateStarRating(0)

    // Resetear el formulario
    document.getElementById("rating-form").reset()
  }

  // Cerrar modal de valoración
  closeRatingModal() {
    const ratingModal = document.getElementById("rating-modal")
    if (ratingModal) {
      ratingModal.classList.remove("show")
    }

    // Limpiar datos de la valoración actual
    this.targetUserId = null
    this.currentRating = 0
  }

  // Crear modal de valoración si no existe
  createRatingModal() {
    const modalHTML = `
            <div id="rating-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Valorar Usuario</h2>
                        <button id="close-rating-modal" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="rating-form">
                            <div class="form-group">
                                <label>¿Cómo calificarías a este usuario?</label>
                                <div class="star-rating">
                                    <span class="star" data-rating="1"><i class="far fa-star"></i></span>
                                    <span class="star" data-rating="2"><i class="far fa-star"></i></span>
                                    <span class="star" data-rating="3"><i class="far fa-star"></i></span>
                                    <span class="star" data-rating="4"><i class="far fa-star"></i></span>
                                    <span class="star" data-rating="5"><i class="far fa-star"></i></span>
                                </div>
                                <p id="rating-text">Selecciona una calificación</p>
                            </div>
                            <div class="form-group">
                                <label for="rating-comment">Comentario (opcional):</label>
                                <textarea id="rating-comment" rows="4" placeholder="Escribe un comentario sobre tu experiencia..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="cancel-rating-btn" class="btn secondary-btn">Cancelar</button>
                        <button type="button" id="submit-rating-btn" class="btn primary-btn" disabled>Enviar valoración</button>
                    </div>
                </div>
            </div>
        `

    // Agregar el modal al DOM
    const modalContainer = document.createElement("div")
    modalContainer.innerHTML = modalHTML
    document.body.appendChild(modalContainer.firstElementChild)

    // Agregar event listeners
    document.getElementById("close-rating-modal").addEventListener("click", () => {
      this.closeRatingModal()
    })

    document.getElementById("submit-rating-btn").addEventListener("click", () => {
      this.submitRating()
    })

    document.getElementById("cancel-rating-btn").addEventListener("click", () => {
      this.closeRatingModal()
    })

    // Event listeners para las estrellas
    const stars = document.querySelectorAll(".star")
    stars.forEach((star) => {
      // Hover
      star.addEventListener("mouseenter", () => {
        const rating = Number.parseInt(star.dataset.rating)
        this.highlightStars(rating)
      })

      // Click
      star.addEventListener("click", () => {
        const rating = Number.parseInt(star.dataset.rating)
        this.currentRating = rating
        this.updateStarRating(rating)
        document.getElementById("submit-rating-btn").disabled = false
      })
    })

    // Restaurar estrellas al salir del contenedor
    const starContainer = document.querySelector(".star-rating")
    starContainer.addEventListener("mouseleave", () => {
      this.updateStarRating(this.currentRating)
    })
  }

  // Resaltar estrellas al pasar el mouse
  highlightStars(rating) {
    const stars = document.querySelectorAll(".star")
    stars.forEach((star) => {
      const starRating = Number.parseInt(star.dataset.rating)
      if (starRating <= rating) {
        star.innerHTML = '<i class="fas fa-star"></i>'
      } else {
        star.innerHTML = '<i class="far fa-star"></i>'
      }
    })

    // Actualizar texto de valoración
    this.updateRatingText(rating)
  }

  // Actualizar estrellas según la valoración seleccionada
  updateStarRating(rating) {
    const stars = document.querySelectorAll(".star")
    stars.forEach((star) => {
      const starRating = Number.parseInt(star.dataset.rating)
      if (starRating <= rating) {
        star.innerHTML = '<i class="fas fa-star"></i>'
      } else {
        star.innerHTML = '<i class="far fa-star"></i>'
      }
    })

    // Actualizar texto de valoración
    this.updateRatingText(rating)
  }

  // Actualizar texto de valoración
  updateRatingText(rating) {
    const ratingText = document.getElementById("rating-text")
    switch (rating) {
      case 0:
        ratingText.textContent = "Selecciona una calificación"
        break
      case 1:
        ratingText.textContent = "Muy malo"
        break
      case 2:
        ratingText.textContent = "Malo"
        break
      case 3:
        ratingText.textContent = "Regular"
        break
      case 4:
        ratingText.textContent = "Bueno"
        break
      case 5:
        ratingText.textContent = "Excelente"
        break
      default:
        ratingText.textContent = "Selecciona una calificación"
    }
  }

  // Enviar valoración
  async submitRating() {
    // Verificar que se haya seleccionado una valoración
    if (this.currentRating === 0) {
      this.showToast("Debes seleccionar una calificación", "error")
      return
    }

    // Obtener comentario
    const comment = document.getElementById("rating-comment").value

    // Mostrar indicador de carga
    document.getElementById("submit-rating-btn").disabled = true
    document.getElementById("submit-rating-btn").innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'

    try {
      // Crear objeto de valoración
      const ratingData = {
        userId: this.targetUserId,
        rating: this.currentRating,
        comment: comment,
      }

      // Enviar valoración a la API
      const response = await apiService.post("/api/Ratings", ratingData)

      if (response.success) {
        this.showToast("Valoración enviada correctamente", "success")
        this.closeRatingModal()

        // Actualizar la valoración en la caché
        this.userRatings[this.targetUserId] = this.currentRating

        // Actualizar la UI si es necesario
        this.updateUserRatingUI(this.targetUserId, this.currentRating)
      } else {
        console.error("Error al enviar valoración:", response.message)
        this.showToast("Error al enviar valoración: " + response.message, "error")
        document.getElementById("submit-rating-btn").disabled = false
        document.getElementById("submit-rating-btn").innerHTML = "Enviar valoración"
      }
    } catch (error) {
      console.error("Error al enviar valoración:", error)
      this.showToast("Error al enviar valoración. Inténtalo de nuevo.", "error")
      document.getElementById("submit-rating-btn").disabled = false
      document.getElementById("submit-rating-btn").innerHTML = "Enviar valoración"
    }
  }

  // Actualizar la UI con la nueva valoración
  updateUserRatingUI(userId, rating) {
    // Buscar elementos de valoración para este usuario
    const ratingElements = document.querySelectorAll(`.user-rating[data-user-id="${userId}"]`)

    ratingElements.forEach((element) => {
      // Actualizar estrellas
      const stars = element.querySelectorAll(".rating-star")
      stars.forEach((star, index) => {
        if (index < rating) {
          star.innerHTML = '<i class="fas fa-star"></i>'
        } else {
          star.innerHTML = '<i class="far fa-star"></i>'
        }
      })

      // Actualizar texto de valoración si existe
      const ratingText = element.querySelector(".rating-text")
      if (ratingText) {
        ratingText.textContent = `${rating}/5`
      }
    })
  }

  // Obtener valoración de un usuario
  async getUserRating(userId) {
    try {
      // Verificar si ya tenemos la valoración en caché
      if (this.userRatings[userId] !== undefined) {
        return this.userRatings[userId]
      }

      // Obtener valoración de la API
      const response = await apiService.get(`/api/Ratings/user/${userId}`)

      if (response.success) {
        const rating = response.data.averageRating || 0
        // Guardar en caché
        this.userRatings[userId] = rating
        return rating
      } else {
        console.error("Error al obtener valoración:", response.message)
        return 0
      }
    } catch (error) {
      console.error("Error al obtener valoración:", error)
      return 0
    }
  }

  // Obtener valoraciones detalladas de un usuario
  async getUserRatingDetails(userId) {
    try {
      const response = await apiService.get(`/api/Ratings/user/${userId}/details`)

      if (response.success) {
        return response.data
      } else {
        console.error("Error al obtener detalles de valoración:", response.message)
        return null
      }
    } catch (error) {
      console.error("Error al obtener detalles de valoración:", error)
      return null
    }
  }

  // Renderizar estrellas de valoración para un usuario
  async renderUserRating(container, userId, showCount = false) {
    // Crear contenedor de valoración
    const ratingContainer = document.createElement("div")
    ratingContainer.className = "user-rating"
    ratingContainer.dataset.userId = userId

    // Crear estrellas (inicialmente vacías)
    const starsContainer = document.createElement("div")
    starsContainer.className = "stars-container"

    for (let i = 0; i < 5; i++) {
      const star = document.createElement("span")
      star.className = "rating-star"
      star.innerHTML = '<i class="far fa-star"></i>'
      starsContainer.appendChild(star)
    }

    ratingContainer.appendChild(starsContainer)

    // Agregar texto de valoración si se solicita
    if (showCount) {
      const ratingText = document.createElement("span")
      ratingText.className = "rating-text"
      ratingText.textContent = "0/5"
      ratingContainer.appendChild(ratingText)
    }

    // Agregar al contenedor
    container.appendChild(ratingContainer)

    // Obtener y mostrar la valoración
    const rating = await this.getUserRating(userId)
    this.updateUserRatingUI(userId, rating)

    return ratingContainer
  }

  // Renderizar sección completa de valoraciones para un perfil de usuario
  async renderUserRatingSection(container, userId) {
    // Crear contenedor de sección
    const sectionContainer = document.createElement("div")
    sectionContainer.className = "rating-section"

    // Título de la sección
    const sectionTitle = document.createElement("h3")
    sectionTitle.textContent = "Valoraciones"
    sectionContainer.appendChild(sectionTitle)

    // Valoración promedio
    const averageContainer = document.createElement("div")
    averageContainer.className = "average-rating"

    // Renderizar estrellas
    await this.renderUserRating(averageContainer, userId, true)

    // Botón para valorar (solo si el usuario está autenticado y no es el mismo perfil)
    if (this.isAuthenticated && tokenService.getUserId() !== userId) {
      const rateButton = document.createElement("button")
      rateButton.className = "btn primary-btn rate-user-btn"
      rateButton.dataset.userId = userId
      rateButton.innerHTML = '<i class="fas fa-star"></i> Valorar usuario'
      averageContainer.appendChild(rateButton)
    }

    sectionContainer.appendChild(averageContainer)

    // Obtener valoraciones detalladas
    const ratingDetails = await this.getUserRatingDetails(userId)

    if (ratingDetails && ratingDetails.ratings && ratingDetails.ratings.length > 0) {
      // Contenedor de comentarios
      const commentsContainer = document.createElement("div")
      commentsContainer.className = "rating-comments"

      // Título de comentarios
      const commentsTitle = document.createElement("h4")
      commentsTitle.textContent = "Comentarios"
      commentsContainer.appendChild(commentsTitle)

      // Listar comentarios
      ratingDetails.ratings.forEach((rating) => {
        if (rating.comment) {
          const commentItem = document.createElement("div")
          commentItem.className = "rating-comment-item"

          // Información del usuario que valoró
          const userInfo = document.createElement("div")
          userInfo.className = "comment-user-info"

          // Estrellas del comentario
          const commentStars = document.createElement("div")
          commentStars.className = "comment-stars"

          for (let i = 0; i < 5; i++) {
            const star = document.createElement("span")
            star.className = "rating-star small"
            star.innerHTML = i < rating.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'
            commentStars.appendChild(star)
          }

          userInfo.appendChild(commentStars)

          // Nombre del usuario
          if (rating.raterName) {
            const userName = document.createElement("span")
            userName.className = "comment-user-name"
            userName.textContent = rating.raterName
            userInfo.appendChild(userName)
          }

          // Fecha del comentario
          const commentDate = document.createElement("span")
          commentDate.className = "comment-date"
          const date = new Date(rating.createdAt)
          commentDate.textContent = date.toLocaleDateString()
          userInfo.appendChild(commentDate)

          commentItem.appendChild(userInfo)

          // Texto del comentario
          const commentText = document.createElement("p")
          commentText.className = "comment-text"
          commentText.textContent = rating.comment
          commentItem.appendChild(commentText)

          commentsContainer.appendChild(commentItem)
        }
      })

      sectionContainer.appendChild(commentsContainer)
    } else {
      // Mensaje si no hay comentarios
      const noComments = document.createElement("p")
      noComments.className = "no-comments"
      noComments.textContent = "Este usuario aún no tiene valoraciones con comentarios."
      sectionContainer.appendChild(noComments)
    }

    // Agregar al contenedor
    container.appendChild(sectionContainer)

    return sectionContainer
  }

  // Mostrar mensaje toast
  showToast(message, type = "info") {
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.textContent = message

    document.body.appendChild(toast)

    // Mostrar el toast
    setTimeout(() => {
      toast.classList.add("show")
    }, 100)

    // Ocultar y eliminar el toast después de 3 segundos
    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 3000)
  }
}

// Inicializar el gestor de valoraciones cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  const ratingManager = new RatingManager()
  ratingManager.initialize()

  // Exponer el gestor de valoraciones globalmente para uso en otras partes de la aplicación
  window.ratingManager = ratingManager
})

export const ratingManager = window.ratingManager

