// Servicio para gestionar notificaciones
import { apiService } from "./api/apiService.js"
import { tokenService } from "./api/tokenService.js"

class NotificationManager {
  constructor() {
    this.notifications = []
    this.filters = {
      all: true,
      system: false,
      product: false,
      chat: false,
    }
    this.currentPage = 1
    this.pageSize = 10
    this.totalPages = 1
  }

  // Inicializar el gestor de notificaciones
  async initialize() {
    if (!tokenService.getToken()) {
      window.location.href = "sign-in.html"
      return
    }

    await this.loadNotifications()
    this.setupEventListeners()
    this.loadNotificationSettings()
  }

  // Cargar notificaciones desde la API
  async loadNotifications() {
    try {
      const response = await apiService.get(`/api/Notifications?page=${this.currentPage}&pageSize=${this.pageSize}`)

      if (response.success) {
        this.notifications = response.data.items
        this.totalPages = response.data.totalPages
        this.displayNotifications()
        this.updateNotificationBadge()
        this.updatePagination()
      } else {
        console.error("Error al cargar notificaciones:", response.message)
        this.showToast("Error al cargar notificaciones", "error")
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
      this.showToast("Error al cargar notificaciones", "error")
    }
  }

  // Mostrar notificaciones en la interfaz
  displayNotifications() {
    const notificationsContainer = document.getElementById("notifications-container")
    notificationsContainer.innerHTML = ""

    const filteredNotifications = this.filterNotifications()

    if (filteredNotifications.length === 0) {
      notificationsContainer.innerHTML = `
                <div class="empty-state">
                    <img src="img/empty-notifications.svg" alt="No hay notificaciones">
                    <p>No tienes notificaciones</p>
                </div>
            `
      return
    }

    filteredNotifications.forEach((notification) => {
      const notificationElement = this.createNotificationElement(notification)
      notificationsContainer.appendChild(notificationElement)
    })
  }

  // Crear elemento HTML para una notificación
  createNotificationElement(notification) {
    const notificationDiv = document.createElement("div")
    notificationDiv.className = `notification-item ${notification.isRead ? "read" : "unread"}`
    notificationDiv.dataset.id = notification.id

    // Determinar el icono según el tipo de notificación
    let icon = ""
    switch (notification.type) {
      case "system":
        icon = '<i class="fas fa-bell"></i>'
        break
      case "product":
        icon = '<i class="fas fa-tag"></i>'
        break
      case "chat":
        icon = '<i class="fas fa-comment"></i>'
        break
      default:
        icon = '<i class="fas fa-bell"></i>'
    }

    // Formatear la fecha
    const date = new Date(notification.createdAt)
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

    notificationDiv.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-header">
                    <h3>${notification.title}</h3>
                    <span class="notification-time">${formattedDate}</span>
                </div>
                <p>${notification.message}</p>
                ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="notification-action">Ver detalles</a>` : ""}
            </div>
            <div class="notification-actions">
                <button class="mark-read-btn" title="Marcar como leída">
                    <i class="fas fa-check"></i>
                </button>
                <button class="delete-btn" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `

    // Agregar event listeners
    const markReadBtn = notificationDiv.querySelector(".mark-read-btn")
    markReadBtn.addEventListener("click", () => this.markAsRead(notification.id))

    const deleteBtn = notificationDiv.querySelector(".delete-btn")
    deleteBtn.addEventListener("click", () => this.deleteNotification(notification.id))

    // Si hay una URL de acción, agregar event listener
    if (notification.actionUrl) {
      const actionLink = notificationDiv.querySelector(".notification-action")
      actionLink.addEventListener("click", (e) => {
        e.preventDefault()
        this.handleNotificationAction(notification)
      })
    }

    return notificationDiv
  }

  // Filtrar notificaciones según los filtros activos
  filterNotifications() {
    if (this.filters.all) {
      return this.notifications
    }

    return this.notifications.filter((notification) => {
      if (this.filters.system && notification.type === "system") return true
      if (this.filters.product && notification.type === "product") return true
      if (this.filters.chat && notification.type === "chat") return true
      return false
    })
  }

  // Marcar notificación como leída
  async markAsRead(notificationId) {
    try {
      const response = await apiService.put(`/api/Notifications/${notificationId}/read`)

      if (response.success) {
        const notification = this.notifications.find((n) => n.id === notificationId)
        if (notification) {
          notification.isRead = true
          this.displayNotifications()
          this.updateNotificationBadge()
          this.showToast("Notificación marcada como leída", "success")
        }
      } else {
        console.error("Error al marcar notificación como leída:", response.message)
        this.showToast("Error al marcar notificación como leída", "error")
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
      this.showToast("Error al marcar notificación como leída", "error")
    }
  }

  // Eliminar notificación
  async deleteNotification(notificationId) {
    try {
      const response = await apiService.delete(`/api/Notifications/${notificationId}`)

      if (response.success) {
        this.notifications = this.notifications.filter((n) => n.id !== notificationId)
        this.displayNotifications()
        this.updateNotificationBadge()
        this.showToast("Notificación eliminada", "success")
      } else {
        console.error("Error al eliminar notificación:", response.message)
        this.showToast("Error al eliminar notificación", "error")
      }
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
      this.showToast("Error al eliminar notificación", "error")
    }
  }

  // Manejar acción de notificación (abrir producto, chat, etc.)
  handleNotificationAction(notification) {
    // Marcar como leída al hacer clic
    this.markAsRead(notification.id)

    // Redirigir según el tipo de notificación
    if (notification.type === "product") {
      window.location.href = `product-details.html?id=${notification.referenceId}`
    } else if (notification.type === "chat") {
      window.location.href = `profile.html?tab=chats&chatId=${notification.referenceId}`
    } else {
      // Para notificaciones del sistema u otros tipos, usar la URL de acción
      window.location.href = notification.actionUrl
    }
  }

  // Actualizar el contador de notificaciones no leídas
  updateNotificationBadge() {
    const unreadCount = this.notifications.filter((n) => !n.isRead).length
    const badge = document.getElementById("notification-badge")

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount
        badge.style.display = "block"
      } else {
        badge.style.display = "none"
      }
    }
  }

  // Actualizar la paginación
  updatePagination() {
    const paginationContainer = document.getElementById("pagination-container")
    if (!paginationContainer) return

    paginationContainer.innerHTML = ""

    // Botón anterior
    const prevButton = document.createElement("button")
    prevButton.className = "pagination-btn prev"
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior'
    prevButton.disabled = this.currentPage === 1
    prevButton.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--
        this.loadNotifications()
      }
    })
    paginationContainer.appendChild(prevButton)

    // Información de página
    const pageInfo = document.createElement("span")
    pageInfo.className = "page-info"
    pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`
    paginationContainer.appendChild(pageInfo)

    // Botón siguiente
    const nextButton = document.createElement("button")
    nextButton.className = "pagination-btn next"
    nextButton.innerHTML = 'Siguiente <i class="fas fa-chevron-right"></i>'
    nextButton.disabled = this.currentPage === this.totalPages
    nextButton.addEventListener("click", () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.loadNotifications()
      }
    })
    paginationContainer.appendChild(nextButton)
  }

  // Configurar event listeners
  setupEventListeners() {
    // Botón de volver
    const backButton = document.getElementById("back-button")
    if (backButton) {
      backButton.addEventListener("click", () => {
        window.history.back()
      })
    }

    // Botones de filtro
    const filterButtons = document.querySelectorAll(".filter-btn")
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filterType = button.dataset.filter

        // Si se hace clic en "Todos", desactivar los demás filtros
        if (filterType === "all") {
          this.filters = {
            all: true,
            system: false,
            product: false,
            chat: false,
          }
        } else {
          // Si se hace clic en otro filtro, desactivar "Todos"
          this.filters.all = false
          this.filters[filterType] = !this.filters[filterType]

          // Si no hay filtros activos, activar "Todos"
          if (!this.filters.system && !this.filters.product && !this.filters.chat) {
            this.filters.all = true
          }
        }

        // Actualizar UI de filtros
        this.updateFilterButtons()

        // Guardar configuración de filtros
        this.saveNotificationSettings()

        // Mostrar notificaciones filtradas
        this.displayNotifications()
      })
    })

    // Botón de configuración
    const settingsButton = document.getElementById("settings-button")
    if (settingsButton) {
      settingsButton.addEventListener("click", () => {
        const settingsModal = document.getElementById("settings-modal")
        settingsModal.classList.toggle("show")
      })
    }

    // Botón de cerrar modal
    const closeModalButton = document.getElementById("close-modal")
    if (closeModalButton) {
      closeModalButton.addEventListener("click", () => {
        const settingsModal = document.getElementById("settings-modal")
        settingsModal.classList.remove("show")
      })
    }

    // Botón de guardar configuración
    const saveSettingsButton = document.getElementById("save-settings")
    if (saveSettingsButton) {
      saveSettingsButton.addEventListener("click", () => {
        this.saveNotificationSettings()
        const settingsModal = document.getElementById("settings-modal")
        settingsModal.classList.remove("show")
        this.showToast("Configuración guardada", "success")
      })
    }

    // Botón de limpiar todas las notificaciones
    const clearAllButton = document.getElementById("clear-all")
    if (clearAllButton) {
      clearAllButton.addEventListener("click", async () => {
        if (confirm("¿Estás seguro de que deseas eliminar todas las notificaciones?")) {
          await this.clearAllNotifications()
        }
      })
    }

    // Botón de marcar todas como leídas
    const markAllReadButton = document.getElementById("mark-all-read")
    if (markAllReadButton) {
      markAllReadButton.addEventListener("click", async () => {
        await this.markAllAsRead()
      })
    }
  }

  // Actualizar UI de botones de filtro
  updateFilterButtons() {
    const filterButtons = document.querySelectorAll(".filter-btn")
    filterButtons.forEach((button) => {
      const filterType = button.dataset.filter
      if (this.filters[filterType]) {
        button.classList.add("active")
      } else {
        button.classList.remove("active")
      }
    })
  }

  // Guardar configuración de notificaciones
  saveNotificationSettings() {
    const settings = {
      filters: this.filters,
      pushEnabled: document.getElementById("push-notifications").checked,
      emailEnabled: document.getElementById("email-notifications").checked,
      productNotifications: document.getElementById("product-notifications").checked,
      chatNotifications: document.getElementById("chat-notifications").checked,
      systemNotifications: document.getElementById("system-notifications").checked,
    }

    localStorage.setItem("notificationSettings", JSON.stringify(settings))

    // Enviar configuración a la API
    this.updateNotificationPreferences(settings)
  }

  // Cargar configuración de notificaciones
  loadNotificationSettings() {
    const savedSettings = localStorage.getItem("notificationSettings")

    if (savedSettings) {
      const settings = JSON.parse(savedSettings)

      // Cargar filtros
      this.filters = settings.filters || {
        all: true,
        system: false,
        product: false,
        chat: false,
      }

      // Actualizar UI de filtros
      this.updateFilterButtons()

      // Cargar configuración de checkboxes
      const pushCheckbox = document.getElementById("push-notifications")
      const emailCheckbox = document.getElementById("email-notifications")
      const productCheckbox = document.getElementById("product-notifications")
      const chatCheckbox = document.getElementById("chat-notifications")
      const systemCheckbox = document.getElementById("system-notifications")

      if (pushCheckbox) pushCheckbox.checked = settings.pushEnabled !== undefined ? settings.pushEnabled : true
      if (emailCheckbox) emailCheckbox.checked = settings.emailEnabled !== undefined ? settings.emailEnabled : true
      if (productCheckbox)
        productCheckbox.checked = settings.productNotifications !== undefined ? settings.productNotifications : true
      if (chatCheckbox)
        chatCheckbox.checked = settings.chatNotifications !== undefined ? settings.chatNotifications : true
      if (systemCheckbox)
        systemCheckbox.checked = settings.systemNotifications !== undefined ? settings.systemNotifications : true
    }
  }

  // Actualizar preferencias de notificaciones en la API
  async updateNotificationPreferences(settings) {
    try {
      const preferences = {
        pushEnabled: settings.pushEnabled,
        emailEnabled: settings.emailEnabled,
        productNotifications: settings.productNotifications,
        chatNotifications: settings.chatNotifications,
        systemNotifications: settings.systemNotifications,
      }

      const response = await apiService.put("/api/Notifications/preferences", preferences)

      if (!response.success) {
        console.error("Error al actualizar preferencias de notificaciones:", response.message)
      }
    } catch (error) {
      console.error("Error al actualizar preferencias de notificaciones:", error)
    }
  }

  // Limpiar todas las notificaciones
  async clearAllNotifications() {
    try {
      const response = await apiService.delete("/api/Notifications/all")

      if (response.success) {
        this.notifications = []
        this.displayNotifications()
        this.updateNotificationBadge()
        this.showToast("Todas las notificaciones han sido eliminadas", "success")
      } else {
        console.error("Error al eliminar todas las notificaciones:", response.message)
        this.showToast("Error al eliminar notificaciones", "error")
      }
    } catch (error) {
      console.error("Error al eliminar todas las notificaciones:", error)
      this.showToast("Error al eliminar notificaciones", "error")
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead() {
    try {
      const response = await apiService.put("/api/Notifications/read-all")

      if (response.success) {
        this.notifications.forEach((notification) => {
          notification.isRead = true
        })
        this.displayNotifications()
        this.updateNotificationBadge()
        this.showToast("Todas las notificaciones han sido marcadas como leídas", "success")
      } else {
        console.error("Error al marcar todas las notificaciones como leídas:", response.message)
        this.showToast("Error al marcar notificaciones como leídas", "error")
      }
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
      this.showToast("Error al marcar notificaciones como leídas", "error")
    }
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

// Inicializar el gestor de notificaciones cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  const notificationManager = new NotificationManager()
  notificationManager.initialize()

  // Exponer el gestor de notificaciones globalmente para uso en otras partes de la aplicación
  window.notificationManager = notificationManager
})

export const notificationManager = window.notificationManager

