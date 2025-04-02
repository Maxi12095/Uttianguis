// Servicio para gestionar reportes
import { apiService } from "./api/apiService.js"
import { tokenService } from "./api/tokenService.js"

class ReportManager {
  constructor() {
    this.reportTypes = {
      PRODUCT: "product",
      USER: "user",
    }
    this.reportReasons = {
      INAPPROPRIATE: "inappropriate",
      FRAUD: "fraud",
      SPAM: "spam",
      HARASSMENT: "harassment",
      OTHER: "other",
    }
    this.currentScreenshot = null
    this.reportingItemId = null
    this.reportingItemType = null
  }

  // Inicializar el gestor de reportes
  initialize() {
    if (!tokenService.getToken()) {
      window.location.href = "sign-in.html"
      return
    }

    this.setupEventListeners()
  }

  // Configurar event listeners
  setupEventListeners() {
    // Event listener para botones de reporte en la página
    document.addEventListener("click", (event) => {
      // Botón de reportar producto
      if (event.target.closest(".report-product-btn")) {
        const productId = event.target.closest(".report-product-btn").dataset.productId
        this.openReportModal(this.reportTypes.PRODUCT, productId)
      }

      // Botón de reportar usuario
      if (event.target.closest(".report-user-btn")) {
        const userId = event.target.closest(".report-user-btn").dataset.userId
        this.openReportModal(this.reportTypes.USER, userId)
      }
    })

    // Event listener para el modal de reporte
    document.addEventListener("DOMContentLoaded", () => {
      // Botón de cerrar modal
      const closeModalBtn = document.getElementById("close-report-modal")
      if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
          this.closeReportModal()
        })
      }

      // Botón de capturar pantalla
      const captureScreenBtn = document.getElementById("capture-screen-btn")
      if (captureScreenBtn) {
        captureScreenBtn.addEventListener("click", () => {
          this.captureScreen()
        })
      }

      // Botón de enviar reporte
      const submitReportBtn = document.getElementById("submit-report-btn")
      if (submitReportBtn) {
        submitReportBtn.addEventListener("click", () => {
          this.submitReport()
        })
      }

      // Botón de cancelar reporte
      const cancelReportBtn = document.getElementById("cancel-report-btn")
      if (cancelReportBtn) {
        cancelReportBtn.addEventListener("click", () => {
          this.closeReportModal()
        })
      }
    })
  }

  // Abrir modal de reporte
  openReportModal(type, itemId) {
    this.reportingItemType = type
    this.reportingItemId = itemId
    this.currentScreenshot = null

    const reportModal = document.getElementById("report-modal")
    if (!reportModal) {
      this.createReportModal()
    }

    // Actualizar título del modal según el tipo de reporte
    const modalTitle = document.getElementById("report-modal-title")
    if (modalTitle) {
      modalTitle.textContent = type === this.reportTypes.PRODUCT ? "Reportar Producto" : "Reportar Usuario"
    }

    // Mostrar el modal
    document.getElementById("report-modal").classList.add("show")

    // Resetear el formulario
    document.getElementById("report-form").reset()
    document.getElementById("screenshot-preview").innerHTML = ""
    document.getElementById("screenshot-status").textContent = "No se ha capturado ninguna pantalla"
    document.getElementById("submit-report-btn").disabled = true
  }

  // Cerrar modal de reporte
  closeReportModal() {
    const reportModal = document.getElementById("report-modal")
    if (reportModal) {
      reportModal.classList.remove("show")
    }

    // Limpiar datos del reporte actual
    this.reportingItemType = null
    this.reportingItemId = null
    this.currentScreenshot = null
  }

  // Crear modal de reporte si no existe
  createReportModal() {
    const modalHTML = `
            <div id="report-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="report-modal-title">Reportar</h2>
                        <button id="close-report-modal" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="report-form">
                            <div class="form-group">
                                <label for="report-reason">Motivo del reporte:</label>
                                <select id="report-reason" required>
                                    <option value="">Selecciona un motivo</option>
                                    <option value="inappropriate">Contenido inapropiado</option>
                                    <option value="fraud">Fraude o estafa</option>
                                    <option value="spam">Spam</option>
                                    <option value="harassment">Acoso</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="report-description">Descripción:</label>
                                <textarea id="report-description" rows="4" placeholder="Describe el problema..." required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Captura de pantalla (obligatorio):</label>
                                <div class="screenshot-container">
                                    <button type="button" id="capture-screen-btn" class="btn primary-btn">
                                        <i class="fas fa-camera"></i> Capturar pantalla
                                    </button>
                                    <p id="screenshot-status">No se ha capturado ninguna pantalla</p>
                                </div>
                                <div id="screenshot-preview" class="screenshot-preview"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="cancel-report-btn" class="btn secondary-btn">Cancelar</button>
                        <button type="button" id="submit-report-btn" class="btn primary-btn" disabled>Enviar reporte</button>
                    </div>
                </div>
            </div>
        `

    // Agregar el modal al DOM
    const modalContainer = document.createElement("div")
    modalContainer.innerHTML = modalHTML
    document.body.appendChild(modalContainer.firstElementChild)

    // Agregar event listeners
    document.getElementById("close-report-modal").addEventListener("click", () => {
      this.closeReportModal()
    })

    document.getElementById("capture-screen-btn").addEventListener("click", () => {
      this.captureScreen()
    })

    document.getElementById("submit-report-btn").addEventListener("click", () => {
      this.submitReport()
    })

    document.getElementById("cancel-report-btn").addEventListener("click", () => {
      this.closeReportModal()
    })
  }

  // Capturar pantalla
  async captureScreen() {
    try {
      // Ocultar temporalmente el modal para la captura
      const reportModal = document.getElementById("report-modal")
      reportModal.style.display = "none"

      // Usar html2canvas para capturar la pantalla
      // html2canvas is loaded dynamically, so it should be available here
      const canvas = await html2canvas(document.body)

      // Mostrar el modal nuevamente
      reportModal.style.display = "flex"

      // Convertir canvas a imagen
      this.currentScreenshot = canvas.toDataURL("image/png")

      // Mostrar vista previa
      const screenshotPreview = document.getElementById("screenshot-preview")
      screenshotPreview.innerHTML = ""

      const img = document.createElement("img")
      img.src = this.currentScreenshot
      img.alt = "Captura de pantalla"
      img.className = "screenshot-img"

      screenshotPreview.appendChild(img)

      // Actualizar estado
      document.getElementById("screenshot-status").textContent = "Captura realizada correctamente"

      // Habilitar botón de enviar
      document.getElementById("submit-report-btn").disabled = false
    } catch (error) {
      console.error("Error al capturar pantalla:", error)
      document.getElementById("screenshot-status").textContent = "Error al capturar pantalla. Inténtalo de nuevo."
    }
  }

  // Enviar reporte
  async submitReport() {
    // Verificar que se haya capturado una pantalla
    if (!this.currentScreenshot) {
      this.showToast("Debes capturar una pantalla para enviar el reporte", "error")
      return
    }

    // Obtener datos del formulario
    const reason = document.getElementById("report-reason").value
    const description = document.getElementById("report-description").value

    // Validar formulario
    if (!reason || !description) {
      this.showToast("Por favor completa todos los campos", "error")
      return
    }
    this.showToast("Por favor completa todos los campos", "error")
    return

    // Mostrar indicador de carga
    document.getElementById("submit-report-btn").disabled = true
    document.getElementById("submit-report-btn").innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'

    try {
      // Crear objeto de reporte
      const reportData = {
        type: this.reportingItemType,
        itemId: this.reportingItemId,
        reason: reason,
        description: description,
        screenshot: this.currentScreenshot,
      }

      // Enviar reporte a la API
      const response = await apiService.post("/api/Reports", reportData)

      if (response.success) {
        this.showToast("Reporte enviado correctamente", "success")
        this.closeReportModal()
      } else {
        console.error("Error al enviar reporte:", response.message)
        this.showToast("Error al enviar reporte: " + response.message, "error")
        document.getElementById("submit-report-btn").disabled = false
        document.getElementById("submit-report-btn").innerHTML = "Enviar reporte"
      }
    } catch (error) {
      console.error("Error al enviar reporte:", error)
      this.showToast("Error al enviar reporte. Inténtalo de nuevo.", "error")
      document.getElementById("submit-report-btn").disabled = false
      document.getElementById("submit-report-btn").innerHTML = "Enviar reporte"
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

  // Método para agregar botón de reporte a un producto
  addReportButtonToProduct(productElement, productId) {
    const reportButton = document.createElement("button")
    reportButton.className = "report-product-btn"
    reportButton.dataset.productId = productId
    reportButton.innerHTML = '<i class="fas fa-flag"></i> Reportar'

    reportButton.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.openReportModal(this.reportTypes.PRODUCT, productId)
    })

    productElement.appendChild(reportButton)
  }

  // Método para agregar botón de reporte a un perfil de usuario
  addReportButtonToUserProfile(profileElement, userId) {
    const reportButton = document.createElement("button")
    reportButton.className = "report-user-btn"
    reportButton.dataset.userId = userId
    reportButton.innerHTML = '<i class="fas fa-flag"></i> Reportar usuario'

    reportButton.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.openReportModal(this.reportTypes.USER, userId)
    })

    profileElement.appendChild(reportButton)
  }
}

// Inicializar el gestor de reportes cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  // Cargar html2canvas para la captura de pantalla
  const script = document.createElement("script")
  script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js"
  script.onload = () => {
    const reportManager = new ReportManager()
    reportManager.initialize()

    // Exponer el gestor de reportes globalmente para uso en otras partes de la aplicación
    window.reportManager = reportManager
  }
  document.head.appendChild(script)
})

export const reportManager = window.reportManager

