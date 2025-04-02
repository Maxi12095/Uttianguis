/**
 * UTTianguis Admin Dashboard
 * Connects the admin dashboard to the backend API
 */

import apiService from "./api/apiService.js"
import tokenService from "./api/tokenService.js"

// Variables globales
let currentSection = "dashboard"

// Check if user is admin before loading the dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Verify admin access
  if (!tokenService.isAuthenticated()) {
    window.location.href = "sign-in.html?redirect=admin-dashboard.html"
    return
  }

  // Verify if the user is admin
  const userData = tokenService.getUserData()
  if (!userData || userData.role !== "Admin") {
    showToast("No tienes permisos para acceder a esta sección", "error")
    window.location.href = "index.html"
    return
  }

  initAdminDashboard()
})

/**
 * Función para mostrar mensajes de toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (success, error)
 */
function showToast(message, type = "success") {
  // Verificar si Toastify está disponible globalmente
  if (typeof Toastify === "function") {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: type === "success" ? "#28a745" : "#dc3545",
      stopOnFocus: true,
    }).showToast()
  } else {
    // Fallback a alert si Toastify no está disponible
    alert(message)
  }
}

/**
 * Initialize the admin dashboard
 */
async function initAdminDashboard() {
  try {
    // Display admin name
    const adminUsername = document.getElementById("admin-username")
    if (adminUsername) {
      const user = tokenService.getUser()
      adminUsername.textContent = user.name || "Administrador"
    }

    // Set up navigation
    setupNavigation()

    // Load initial data
    await loadDashboardStats()
    await loadRecentActivity()

    // Setup logout button
    const logoutButton = document.getElementById("logout-button")
    if (logoutButton) {
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault()
        tokenService.removeToken()
        window.location.href = "sign-in.html"
      })
    }

    // Setup refresh buttons
    setupRefreshButtons()

    // Load reports, users, products, and categories data
    await loadReportsData()
    await loadUsersData()
    await loadProductsData()
    await loadCategoriesData()

    // Setup section-specific event handlers
    setupReportsEvents()
    setupUsersEvents()
    setupProductsEvents()
    setupCategoriesEvents()
  } catch (error) {
    console.error("Error initializing admin dashboard:", error)
    showToast("Error al cargar el panel de administración", "error")
  }
}

/**
 * Set up navigation
 */
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link")
  const contentSections = document.querySelectorAll(".content-section")

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Get the target section
      const targetSection = link.getAttribute("data-section")

      // Update active link
      navLinks.forEach((navLink) => navLink.classList.remove("active"))
      link.classList.add("active")

      // Show appropriate content section
      contentSections.forEach((section) => {
        section.classList.remove("active")
        if (section.id === targetSection) {
          section.classList.add("active")
        }
      })
    })
  })
}

/**
 * Set up refresh buttons
 */
function setupRefreshButtons() {
  // Dashboard refresh
  const refreshDashboard = document.getElementById("refresh-dashboard")
  if (refreshDashboard) {
    refreshDashboard.addEventListener("click", async () => {
      try {
        await Promise.all([loadDashboardStats(), loadRecentActivity()])
        showToast("Dashboard actualizado", "success")
      } catch (error) {
        console.error("Error refreshing dashboard:", error)
        showToast("Error al actualizar el dashboard", "error")
      }
    })
  }

  // Reports refresh
  const refreshReports = document.getElementById("refresh-reports")
  if (refreshReports) {
    refreshReports.addEventListener("click", async () => {
      try {
        await loadReportsData()
        showToast("Reportes actualizados", "success")
      } catch (error) {
        console.error("Error refreshing reports:", error)
        showToast("Error al actualizar los reportes", "error")
      }
    })
  }

  // Users refresh
  const refreshUsers = document.getElementById("refresh-users")
  if (refreshUsers) {
    refreshUsers.addEventListener("click", async () => {
      try {
        await loadUsersData()
        showToast("Usuarios actualizados", "success")
      } catch (error) {
        console.error("Error refreshing users:", error)
        showToast("Error al actualizar los usuarios", "error")
      }
    })
  }

  // Products refresh
  const refreshProducts = document.getElementById("refresh-products")
  if (refreshProducts) {
    refreshProducts.addEventListener("click", async () => {
      try {
        await loadProductsData()
        showToast("Productos actualizados", "success")
      } catch (error) {
        console.error("Error refreshing products:", error)
        showToast("Error al actualizar los productos", "error")
      }
    })
  }
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
  try {
    const stats = await apiService.get("/api/admin/statistics")

    // Update stats cards
    document.getElementById("total-users").textContent = stats.totalUsers || "0"
    document.getElementById("total-products").textContent = stats.totalProducts || "0"
    document.getElementById("active-reports").textContent = stats.pendingReports || "0"
    document.getElementById("total-categories").textContent = stats.totalCategories || "0"
  } catch (error) {
    console.error("Error loading dashboard statistics:", error)
    throw error
  }
}

/**
 * Load recent activity
 */
async function loadRecentActivity() {
  try {
    const recentActivity = await apiService.get("/api/admin/activity")
    const activityTableBody = document.getElementById("recent-activity")

    if (!activityTableBody) return

    // Clear table
    activityTableBody.innerHTML = ""

    if (!recentActivity || recentActivity.length === 0) {
      activityTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No hay actividad reciente</td>
                </tr>
            `
      return
    }

    // Add activity rows
    recentActivity.forEach((activity) => {
      const row = document.createElement("tr")

      // Determine icon based on activity type
      let iconClass = "fas fa-info-circle text-primary"

      switch (activity.type.toLowerCase()) {
        case "user":
          iconClass = "fas fa-user text-primary"
          break
        case "product":
          iconClass = "fas fa-box text-success"
          break
        case "report":
          iconClass = "fas fa-flag text-danger"
          break
      }

      const date = new Date(activity.timestamp)
      const formattedDate = formatDate(date)

      row.innerHTML = `
                <td><i class="${iconClass}"></i> ${activity.type}</td>
                <td>${activity.description}</td>
                <td>${activity.userName}</td>
                <td>${formattedDate}</td>
            `

      activityTableBody.appendChild(row)
    })
  } catch (error) {
    console.error("Error loading recent activity:", error)
    throw error
  }
}

/**
 * Load reports data
 */
async function loadReportsData() {
  try {
    // Get filters
    const status = document.getElementById("report-status-filter")?.value || "all"
    const type = document.getElementById("report-type-filter")?.value || "all"
    const date = document.getElementById("report-date-filter")?.value || "all"

    // Build query parameters
    const params = new URLSearchParams()
    if (status !== "all") params.append("status", status)
    if (type !== "all") params.append("type", type)
    if (date !== "all") params.append("date", date)

    // Get reports
    const reports = await apiService.get(`/api/reports?${params.toString()}`)
    const reportsTableBody = document.getElementById("reports-table")

    if (!reportsTableBody) return

    // Clear table
    reportsTableBody.innerHTML = ""

    if (!reports || reports.length === 0) {
      reportsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No hay reportes disponibles</td>
                </tr>
            `
      return
    }

    // Add report rows
    reports.forEach((report) => {
      const row = document.createElement("tr")

      // Determine status badge
      let statusBadge = `<span class="badge bg-secondary">Desconocido</span>`

      switch (report.status.toLowerCase()) {
        case "pending":
          statusBadge = `<span class="badge bg-warning">Pendiente</span>`
          break
        case "resolved":
          statusBadge = `<span class="badge bg-success">Resuelto</span>`
          break
        case "dismissed":
          statusBadge = `<span class="badge bg-danger">Desestimado</span>`
          break
      }

      const date = new Date(report.createdAt)
      const formattedDate = formatDate(date)

      row.innerHTML = `
                <td>${report.id}</td>
                <td>${report.reportType}</td>
                <td>${report.reporterName}</td>
                <td>${report.reason}</td>
                <td>${formattedDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-report" data-id="${report.id}" data-bs-toggle="modal" data-bs-target="#reportDetailModal">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `

      reportsTableBody.appendChild(row)
    })

    // Set up view report buttons
    setupViewReportButtons()
  } catch (error) {
    console.error("Error loading reports data:", error)
    throw error
  }
}

/**
 * Set up view report buttons
 */
function setupViewReportButtons() {
  const viewReportButtons = document.querySelectorAll(".view-report")

  viewReportButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const reportId = button.getAttribute("data-id")

        // Show loading state
        const reportDetailContent = document.getElementById("report-detail-content")
        if (reportDetailContent) {
          reportDetailContent.innerHTML = `
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    `
        }

        // Fetch report details
        const report = await apiService.get(`/api/reports/${reportId}`)

        // Update modal
        updateReportDetailModal(report)
      } catch (error) {
        console.error("Error loading report details:", error)
        showToast("Error al cargar los detalles del reporte", "error")
      }
    })
  })
}

/**
 * Update report detail modal
 */
function updateReportDetailModal(report) {
  const reportDetailContent = document.getElementById("report-detail-content")

  if (!reportDetailContent) return

  // Determine reported item info
  let reportedItemInfo = ""

  if (report.reportType === "Product") {
    reportedItemInfo = `
            <div class="mb-3">
                <h6>Producto reportado:</h6>
                <p><a href="product-details.html?id=${report.reportedItemId}" target="_blank">${report.reportedItemName || "Ver producto"}</a></p>
            </div>
        `
  } else if (report.reportType === "User") {
    reportedItemInfo = `
            <div class="mb-3">
                <h6>Usuario reportado:</h6>
                <p><a href="profile.html?id=${report.reportedItemId}" target="_blank">${report.reportedItemName || "Ver usuario"}</a></p>
            </div>
        `
  }

  // Determine status badge
  let statusBadge = `<span class="badge bg-secondary">Desconocido</span>`

  switch (report.status.toLowerCase()) {
    case "pending":
      statusBadge = `<span class="badge bg-warning">Pendiente</span>`
      break
    case "resolved":
      statusBadge = `<span class="badge bg-success">Resuelto</span>`
      break
    case "dismissed":
      statusBadge = `<span class="badge bg-danger">Desestimado</span>`
      break
  }

  // Format dates
  const createdAtDate = new Date(report.createdAt)
  const formattedCreatedAt = formatDate(createdAtDate)

  let resolvedAtInfo = ""
  if (report.resolvedAt) {
    const resolvedAtDate = new Date(report.resolvedAt)
    const formattedResolvedAt = formatDate(resolvedAtDate)

    resolvedAtInfo = `
            <div class="mb-3">
                <h6>Fecha de resolución:</h6>
                <p>${formattedResolvedAt}</p>
            </div>
        `
  }

  // Populate modal content
  reportDetailContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <h6>ID del reporte:</h6>
                    <p>${report.id}</p>
                </div>
                <div class="mb-3">
                    <h6>Reportado por:</h6>
                    <p><a href="profile.html?id=${report.reporterId}" target="_blank">${report.reporterName}</a></p>
                </div>
                ${reportedItemInfo}
                <div class="mb-3">
                    <h6>Fecha del reporte:</h6>
                    <p>${formattedCreatedAt}</p>
                </div>
                <div class="mb-3">
                    <h6>Estado:</h6>
                    <p>${statusBadge}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <h6>Motivo:</h6>
                    <p>${report.reason}</p>
                </div>
                <div class="mb-3">
                    <h6>Descripción:</h6>
                    <p>${report.description}</p>
                </div>
                ${
                  report.status !== "Pending"
                    ? `
                    <div class="mb-3">
                        <h6>Respuesta del administrador:</h6>
                        <p>${report.adminResponse || "Sin respuesta"}</p>
                    </div>
                    ${resolvedAtInfo}
                `
                    : ""
                }
            </div>
        </div>
        ${
          report.status === "Pending"
            ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Resolución:</h6>
                    <textarea id="admin-response" class="form-control" rows="3" placeholder="Escribe una resolución para este reporte..."></textarea>
                </div>
            </div>
        `
            : ""
        }
    `

  // Configure buttons based on report status
  const resolveButton = document.getElementById("resolve-report-btn")
  const dismissButton = document.getElementById("dismiss-report-btn")

  if (resolveButton && dismissButton) {
    if (report.status === "Pending") {
      // Enable and show buttons for pending reports
      resolveButton.style.display = "block"
      dismissButton.style.display = "block"

      resolveButton.disabled = false
      dismissButton.disabled = false

      // Set up action handlers
      resolveButton.onclick = () => handleResolveReport(report.id)
      dismissButton.onclick = () => handleDismissReport(report.id)
    } else {
      // Hide buttons for already processed reports
      resolveButton.style.display = "none"
      dismissButton.style.display = "none"
    }
  }
}

/**
 * Handle resolve report
 */
async function handleResolveReport(reportId) {
  try {
    const adminResponse = document.getElementById("admin-response").value

    if (!adminResponse || adminResponse.trim() === "") {
      showToast("Por favor, ingresa una respuesta antes de resolver el reporte", "error")
      return
    }

    // Show loading state
    const resolveButton = document.getElementById("resolve-report-btn")
    if (resolveButton) {
      resolveButton.disabled = true
      resolveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
    }

    // Send resolve request
    await apiService.put(`/api/reports/${reportId}/resolve`, {
      adminResponse: adminResponse,
    })

    // Show success message
    showToast("Reporte resuelto exitosamente", "success")

    // Close modal
    const modalElement = document.getElementById("reportDetailModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload reports data
    await loadReportsData()
    await loadDashboardStats()
  } catch (error) {
    console.error("Error resolving report:", error)
    showToast("Error al resolver el reporte", "error")

    // Reset button state
    const resolveButton = document.getElementById("resolve-report-btn")
    if (resolveButton) {
      resolveButton.disabled = false
      resolveButton.innerHTML = "Resolver"
    }
  }
}

/**
 * Handle dismiss report
 */
async function handleDismissReport(reportId) {
  try {
    const adminResponse = document.getElementById("admin-response").value

    if (!adminResponse || adminResponse.trim() === "") {
      showToast("Por favor, ingresa un motivo para desestimar el reporte", "error")
      return
    }

    // Show loading state
    const dismissButton = document.getElementById("dismiss-report-btn")
    if (dismissButton) {
      dismissButton.disabled = true
      dismissButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
    }

    // Send dismiss request
    await apiService.put(`/api/reports/${reportId}/dismiss`, {
      adminResponse: adminResponse,
    })

    // Show success message
    showToast("Reporte desestimado exitosamente", "success")

    // Close modal
    const modalElement = document.getElementById("reportDetailModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload reports data
    await loadReportsData()
    await loadDashboardStats()
  } catch (error) {
    console.error("Error dismissing report:", error)
    showToast("Error al desestimar el reporte", "error")

    // Reset button state
    const dismissButton = document.getElementById("dismiss-report-btn")
    if (dismissButton) {
      dismissButton.disabled = false
      dismissButton.innerHTML = "Desestimar"
    }
  }
}

/**
 * Load users data
 */
async function loadUsersData() {
  try {
    // Get filters
    const role = document.getElementById("user-role-filter")?.value || "all"
    const status = document.getElementById("user-status-filter")?.value || "all"
    const search = document.getElementById("user-search")?.value || ""

    // Build query parameters
    const params = new URLSearchParams()
    if (role !== "all") params.append("role", role)
    if (status !== "all") params.append("status", status)
    if (search) params.append("search", search)

    // Get users
    const users = await apiService.get(`/api/admin/users?${params.toString()}`)
    const usersTableBody = document.getElementById("users-table")

    if (!usersTableBody) return

    // Clear table
    usersTableBody.innerHTML = ""

    if (!users || users.length === 0) {
      usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No hay usuarios disponibles</td>
                </tr>
            `
      return
    }

    // Add user rows
    users.forEach((user) => {
      const row = document.createElement("tr")

      // Determine role badge
      const roleBadge = user.isAdmin
        ? `<span class="badge bg-primary">Administrador</span>`
        : `<span class="badge bg-secondary">Usuario</span>`

      // Determine status badge
      let statusBadge = `<span class="badge bg-success">Activo</span>`

      if (user.isDeleted) {
        statusBadge = `<span class="badge bg-danger">Eliminado</span>`
      } else if (user.isSuspended) {
        statusBadge = `<span class="badge bg-warning">Suspendido</span>`
      }

      const date = new Date(user.createdAt)
      const formattedDate = formatDate(date)

      row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${formattedDate}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-user" data-id="${user.id}" data-bs-toggle="modal" data-bs-target="#userDetailModal">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `

      usersTableBody.appendChild(row)
    })

    // Set up view user buttons
    setupViewUserButtons()
  } catch (error) {
    console.error("Error loading users data:", error)
    throw error
  }
}

/**
 * Set up view user buttons
 */
function setupViewUserButtons() {
  const viewUserButtons = document.querySelectorAll(".view-user")

  viewUserButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const userId = button.getAttribute("data-id")

        // Show loading state
        const userDetailContent = document.getElementById("user-detail-content")
        if (userDetailContent) {
          userDetailContent.innerHTML = `
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    `
        }

        // Fetch user details
        const user = await apiService.get(`/api/admin/users/${userId}`)

        // Update modal
        updateUserDetailModal(user)
      } catch (error) {
        console.error("Error loading user details:", error)
        showToast("Error al cargar los detalles del usuario", "error")
      }
    })
  })
}

/**
 * Update user detail modal
 */
function updateUserDetailModal(user) {
  const userDetailContent = document.getElementById("user-detail-content")

  if (!userDetailContent) return

  // Determine role and status badges
  const roleBadge = user.isAdmin
    ? `<span class="badge bg-primary">Administrador</span>`
    : `<span class="badge bg-secondary">Usuario</span>`

  let statusBadge = `<span class="badge bg-success">Activo</span>`

  if (user.isDeleted) {
    statusBadge = `<span class="badge bg-danger">Eliminado</span>`
  } else if (user.isSuspended) {
    statusBadge = `<span class="badge bg-warning">Suspendido</span>`
  }

  // Format dates
  const createdAtDate = new Date(user.createdAt)
  const formattedCreatedAt = formatDate(createdAtDate)

  // Populate modal content
  userDetailContent.innerHTML = `
        <div class="row">
            <div class="col-md-4 text-center mb-4">
                <img src="${user.avatarUrl || "images/default-avatar.jpg"}" alt="${user.name}" class="img-fluid rounded-circle mb-3" style="width: 150px; height: 150px; object-fit: cover;">
                <h5>${user.name}</h5>
                <p>${user.email}</p>
                <div>
                    ${roleBadge} ${statusBadge}
                </div>
            </div>
            <div class="col-md-8">
                <div class="row">
                    <div class="col-sm-6">
                        <div class="mb-3">
                            <h6>ID del usuario:</h6>
                            <p>${user.id}</p>
                        </div>
                        <div class="mb-3">
                            <h6>Teléfono:</h6>
                            <p>${user.phone || "No disponible"}</p>
                        </div>
                        <div class="mb-3">
                            <h6>Fecha de registro:</h6>
                            <p>${formattedCreatedAt}</p>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="mb-3">
                            <h6>Productos publicados:</h6>
                            <p>${user.productsCount || "0"}</p>
                        </div>
                        <div class="mb-3">
                            <h6>Valoración:</h6>
                            <p>${getStarRating(user.rating || 0)} (${user.ratingCount || 0} valoraciones)</p>
                        </div>
                        <div class="mb-3">
                            <h6>Reportes recibidos:</h6>
                            <p>${user.reportsCount || "0"}</p>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <div class="mb-3">
                            <h6>Biografía:</h6>
                            <p>${user.bio || "No disponible"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

  // Configure buttons based on user status
  const suspendButton = document.getElementById("suspend-user-btn")
  const activateButton = document.getElementById("activate-user-btn")
  const toggleAdminButton = document.getElementById("toggle-admin-btn")

  if (suspendButton && activateButton && toggleAdminButton) {
    // Configure suspend/activate buttons
    if (user.isSuspended) {
      suspendButton.style.display = "none"
      activateButton.style.display = "block"
      activateButton.onclick = () => handleActivateUser(user.id)
    } else {
      suspendButton.style.display = "block"
      activateButton.style.display = "none"
      suspendButton.onclick = () => handleSuspendUser(user.id)
    }

    // Configure admin toggle button
    if (user.isAdmin) {
      toggleAdminButton.textContent = "Quitar rol de administrador"
    } else {
      toggleAdminButton.textContent = "Hacer administrador"
    }

    toggleAdminButton.onclick = () => handleToggleAdmin(user.id, !user.isAdmin)
  }
}

/**
 * Handle activate user
 */
async function handleActivateUser(userId) {
  try {
    // Show loading state
    const activateButton = document.getElementById("activate-user-btn")
    if (activateButton) {
      activateButton.disabled = true
      activateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
    }

    // Send activate request
    await apiService.put(`/api/admin/users/${userId}/activate`)

    // Show success message
    showToast("Usuario activado exitosamente", "success")

    // Close modal
    const modalElement = document.getElementById("userDetailModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload users data
    await loadUsersData()
  } catch (error) {
    console.error("Error activating user:", error)
    showToast("Error al activar el usuario", "error")

    // Reset button state
    const activateButton = document.getElementById("activate-user-btn")
    if (activateButton) {
      activateButton.disabled = false
      activateButton.innerHTML = "Activar"
    }
  }
}

/**
 * Handle suspend user
 */
async function handleSuspendUser(userId) {
  try {
    // Confirm suspension
    if (!confirm("¿Estás seguro que deseas suspender a este usuario? Esto impedirá que pueda iniciar sesión.")) {
      return
    }

    // Show loading state
    const suspendButton = document.getElementById("suspend-user-btn")
    if (suspendButton) {
      suspendButton.disabled = true
      suspendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
    }

    // Send suspend request
    await apiService.put(`/api/admin/users/${userId}/suspend`)

    // Show success message
    showToast("Usuario suspendido exitosamente", "success")

    // Close modal
    const modalElement = document.getElementById("userDetailModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload users data
    await loadUsersData()
  } catch (error) {
    console.error("Error suspending user:", error)
    showToast("Error al suspender el usuario", "error")

    // Reset button state
    const suspendButton = document.getElementById("suspend-user-btn")
    if (suspendButton) {
      suspendButton.disabled = false
      suspendButton.innerHTML = "Suspender"
    }
  }
}

/**
 * Handle toggle admin role
 */
async function handleToggleAdmin(userId, makeAdmin) {
  try {
    // Confirm action
    const action = makeAdmin ? "dar permisos de administrador" : "quitar permisos de administrador"
    if (!confirm(`¿Estás seguro que deseas ${action} a este usuario?`)) {
      return
    }

    // Show loading state
    const toggleAdminButton = document.getElementById("toggle-admin-btn")
    if (toggleAdminButton) {
      toggleAdminButton.disabled = true
      toggleAdminButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
    }

    // Send toggle admin request
    await apiService.put(`/api/admin/users/${userId}/toggleAdmin`, { isAdmin: makeAdmin })

    // Show success message
    const message = makeAdmin ? "Permisos de administrador otorgados" : "Permisos de administrador revocados"
    showToast(message, "success")

    // Close modal
    const modalElement = document.getElementById("userDetailModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload users data
    await loadUsersData()
  } catch (error) {
    console.error("Error changing admin status:", error)
    showToast("Error al cambiar el estado de administrador", "error")

    // Reset button state
    const toggleAdminButton = document.getElementById("toggle-admin-btn")
    if (toggleAdminButton) {
      toggleAdminButton.disabled = false
      toggleAdminButton.innerHTML = makeAdmin ? "Hacer administrador" : "Quitar rol de administrador"
    }
  }
}

/**
 * Load products data
 */
async function loadProductsData() {
  try {
    // Get filters
    const category = document.getElementById("product-category-filter")?.value || "all"
    const status = document.getElementById("product-status-filter")?.value || "all"
    const price = document.getElementById("product-price-filter")?.value || "all"
    const search = document.getElementById("product-search")?.value || ""

    // Build query parameters
    const params = new URLSearchParams()
    if (category !== "all") params.append("category", category)
    if (status !== "all") params.append("status", status)
    if (price !== "all") params.append("price", price)
    if (search) params.append("search", search)

    // Get products
    const products = await apiService.get(`/api/admin/products?${params.toString()}`)
    const productsTableBody = document.getElementById("products-table")

    if (!productsTableBody) return

    // Clear table
    productsTableBody.innerHTML = ""

    if (!products || products.length === 0) {
      productsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No hay productos disponibles</td>
                </tr>
            `
      return
    }

    // Add product rows
    products.forEach((product) => {
      const row = document.createElement("tr")

      // Determine status badge
      let statusBadge = `<span class="badge bg-success">Activo</span>`

      if (product.isDeleted) {
        statusBadge = `<span class="badge bg-danger">Eliminado</span>`
      } else if (product.isSuspended) {
        statusBadge = `<span class="badge bg-warning">Suspendido</span>`
      } else if (product.isSold) {
        statusBadge = `<span class="badge bg-info">Vendido</span>`
      }

      // Get thumbnail image URL or default
      const thumbnailUrl =
        product.images && product.images.length > 0 ? product.images[0] : "images/default-product.jpg"

      row.innerHTML = `
                <td>${product.id}</td>
                <td>
                    <img src="${thumbnailUrl}" alt="${product.title}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td>${product.title}</td>
                <td>${product.categoryName}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.sellerName}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-product" data-id="${product.id}" data-bs-toggle="modal" data-bs-target="#productDetailModal">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `

      productsTableBody.appendChild(row)
    })

    // Set up view product buttons
    setupViewProductButtons()
  } catch (error) {
    console.error("Error loading products data:", error)
    throw error
  }
}

/**
 * Set up view product buttons
 */
function setupViewProductButtons() {
  const viewProductButtons = document.querySelectorAll(".view-product")

  viewProductButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const productId = button.getAttribute("data-id")

        // Show loading state
        const productDetailContent = document.getElementById("product-detail-content")
        if (productDetailContent) {
          productDetailContent.innerHTML = `
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    `
        }

        // Fetch product details
        const product = await apiService.get(`/api/products/${productId}`)

        // Update modal
        updateProductDetailModal(product)
      } catch (error) {
        console.error("Error loading product details:", error)
        showToast("Error al cargar los detalles del producto", "error")
      }
    })
  })
}

/**
 * Update product detail modal
 */
function updateProductDetailModal(product) {
  const productDetailContent = document.getElementById("product-detail-content")

  if (!productDetailContent) return

  // Determine status badge
  let statusBadge = `<span class="badge bg-success">Activo</span>`

  if (product.isDeleted) {
    statusBadge = `<span class="badge bg-danger">Eliminado</span>`
  } else if (product.isSuspended) {
    statusBadge = `<span class="badge bg-warning">Suspendido</span>`
  } else if (product.isSold) {
    statusBadge = `<span class="badge bg-info">Vendido</span>`
  }

  // Format dates
  const createdAtDate = new Date(product.createdAt)
  const formattedCreatedAt = formatDate(createdAtDate)

  // Create image gallery HTML
  let imagesHtml = '<p class="text-muted">No hay imágenes disponibles</p>'

  if (product.images && product.images.length > 0) {
    imagesHtml = `
            <div class="row g-2">
                ${product.images
                  .map(
                    (image) => `
                    <div class="col-4">
                        <a href="${image}" target="_blank">
                            <img src="${image}" alt="Imagen del producto" class="img-thumbnail" style="width: 100%; height: 100px; object-fit: cover;">
                        </a>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `
  }

  // Populate modal content
  productDetailContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h5 class="mb-3">${product.title}</h5>
                <div class="mb-3">
                    <h6>Categoría:</h6>
                    <p>${product.categoryName}</p>
                </div>
                <div class="mb-3">
                    <h6>Precio:</h6>
                    <p class="text-primary fw-bold">$${product.price.toFixed(2)}</p>
                </div>
                <div class="mb-3">
                    <h6>Estado:</h6>
                    <p>${statusBadge}</p>
                </div>
                <div class="mb-3">
                    <h6>Condición:</h6>
                    <p>${formatCondition(product.condition)}</p>
                </div>
                <div class="mb-3">
                    <h6>Vendedor:</h6>
                    <p><a href="profile.html?id=${product.sellerId}" target="_blank">${product.sellerName}</a></p>
                </div>
                <div class="mb-3">
                    <h6>Fecha de publicación:</h6>
                    <p>${formattedCreatedAt}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <h6>Descripción:</h6>
                    <p>${product.description}</p>
                </div>
                <div class="mb-3">
                    <h6>Imágenes:</h6>
                    ${imagesHtml}
                </div>
            </div>
        </div>
    `

  // Configure buttons based on product status
  const suspendButton = document.getElementById("suspend-product-btn")
  const activateButton = document.getElementById("activate-product-btn")
  const deleteButton = document.getElementById("delete-product-btn")

  if (suspendButton && activateButton && deleteButton) {
    // Configure suspend/activate buttons
    if (product.isSuspended) {
      suspendButton.style.display = "none"
      activateButton.style.display = "block"
      activateButton.onclick = () => handleActivateProduct(product.id)
    } else {
      suspendButton.style.display = "block"
      activateButton.style.display = "none"
      suspendButton.onclick = () => handleSuspendProduct(product.id)
    }

    // Configure delete button
    deleteButton.onclick = () => handleDeleteProduct(product.id)
  }
}

/**
 * Handle activate product
 */
async function handleActivateProduct(productId) {
  try {
    // Show loading state
    const activateButton = document.getElementById("activate-product-btn")
    if (activateButton) {
      activateButton.disabled = true
      activateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
    }

    // Send activate request
    await apiService.put(`/api/admin/products/${productId}/activate`)

    // Show success message
    showToast("Producto activado exitosamente", "success")

    // Close modal
    const modalElement = document.getElementById("productDetailModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload products data
    await loadProductsData()
  } catch (error) {
    console.error("Error activating product:", error)
    showToast("Error al activar el producto", "error")

    // Reset button state
    const activateButton = document.getElementById("activate-product-btn")
    if (activateButton) {
      activateButton.disabled = false
      activateButton.innerHTML = "Activar"
    }
  }
}

/**
 * Handle suspend product
 */
async function handleSuspendProduct(productId) {
  try {
    // Confirm suspension
    if (!confirm("¿Estás seguro que deseas suspender este producto? Dejará de mostrarse en el marketplace.")) {
      return
    }

    // Show loading state
    const suspendButton = document.getElementById("suspend-product-btn")
    if (suspendButton) {
      suspendButton.disabled = true
      suspendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
    }

    // Send suspend request
    await apiService.put(`/api/admin/products/${productId}/suspend`)

    // Show success message
    showToast("Producto suspendido exitosamente", "success")

    // Close modal
    const modalElement = document.getElementById("productDetailModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload products data
    await loadProductsData()
  } catch (error) {
    console.error("Error suspending product:", error)
    showToast("Error al suspender el producto", "error")

    // Reset button state
    const suspendButton = document.getElementById("suspend-product-btn")
    if (suspendButton) {
      suspendButton.disabled = false
      suspendButton.innerHTML = "Suspender"
    }
  }
}

/**
 * Handle delete product
 */
async function handleDeleteProduct(productId) {
  try {
    // Confirm deletion
    if (!confirm("¿Estás seguro que deseas eliminar este producto? Esta acción no se puede deshacer.")) {
      return
    }

    // Show loading state
    const deleteButton = document.getElementById("delete-product-btn")
    if (deleteButton) {
      deleteButton.disabled = true
      deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'
    }

    // Send delete request
    await apiService.delete(`/api/admin/products/${productId}`)

    // Show success message
    showToast("Producto eliminado exitosamente", "success")

    // Close modal
    const modalElement = document.getElementById("productDetailModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload products data
    await loadProductsData()
  } catch (error) {
    console.error("Error deleting product:", error)
    showToast("Error al eliminar el producto", "error")

    // Reset button state
    const deleteButton = document.getElementById("delete-product-btn")
    if (deleteButton) {
      deleteButton.disabled = false
      deleteButton.innerHTML = "Eliminar"
    }
  }
}

/**
 * Load categories data
 */
async function loadCategoriesData() {
  try {
    // Get categories
    const categories = await apiService.get("/api/categories")
    const categoriesTableBody = document.getElementById("categories-table")

    if (!categoriesTableBody) return

    // Clear table
    categoriesTableBody.innerHTML = ""

    if (!categories || categories.length === 0) {
      categoriesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No hay categorías disponibles</td>
                </tr>
            `
      return
    }

    // Add category rows
    categories.forEach((category) => {
      const row = document.createElement("tr")

      row.innerHTML = `
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.description || "Sin descripción"}</td>
                <td>${category.productsCount || 0}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-category" data-id="${category.id}" data-name="${category.name}" data-description="${category.description || ""}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-category" data-id="${category.id}" data-name="${category.name}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `

      categoriesTableBody.appendChild(row)
    })

    // Add categories to product filter
    updateCategoryFilters(categories)

    // Set up category buttons
    setupCategoryButtons()
  } catch (error) {
    console.error("Error loading categories data:", error)
    throw error
  }
}

/**
 * Update category filters
 */
function updateCategoryFilters(categories) {
  const categoryFilter = document.getElementById("product-category-filter")

  if (categoryFilter) {
    // Save current selection
    const currentValue = categoryFilter.value

    // Clear options except "All"
    while (categoryFilter.options.length > 1) {
      categoryFilter.remove(1)
    }

    // Add categories
    categories.forEach((category) => {
      const option = document.createElement("option")
      option.value = category.id
      option.textContent = category.name
      categoryFilter.appendChild(option)
    })

    // Restore selection if valid
    if (currentValue !== "all") {
      for (let i = 0; i < categoryFilter.options.length; i++) {
        if (categoryFilter.options[i].value === currentValue) {
          categoryFilter.selectedIndex = i
          break
        }
      }
    }
  }
}

/**
 * Set up category buttons
 */
function setupCategoryButtons() {
  // Add Category button
  const addCategoryBtn = document.getElementById("add-category-btn")
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", () => {
      // Reset form
      document.getElementById("category-id").value = ""
      document.getElementById("category-name").value = ""
      document.getElementById("category-description").value = ""

      // Update modal title
      document.getElementById("categoryModalLabel").textContent = "Nueva Categoría"

      // Show modal (Bootstrap 5)
      const modal = new bootstrap.Modal(document.getElementById("categoryModal"))
      modal.show()
    })
  }

  // Edit Category buttons
  const editButtons = document.querySelectorAll(".edit-category")
  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Set form values
      document.getElementById("category-id").value = button.getAttribute("data-id")
      document.getElementById("category-name").value = button.getAttribute("data-name")
      document.getElementById("category-description").value = button.getAttribute("data-description")

      // Update modal title
      document.getElementById("categoryModalLabel").textContent = "Editar Categoría"

      // Show modal (Bootstrap 5)
      const modal = new bootstrap.Modal(document.getElementById("categoryModal"))
      modal.show()
    })
  })

  // Delete Category buttons
  const deleteButtons = document.querySelectorAll(".delete-category")
  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Get category info
      const categoryId = button.getAttribute("data-id")
      const categoryName = button.getAttribute("data-name")

      // Confirm deletion
      if (confirm(`¿Estás seguro que deseas eliminar la categoría "${categoryName}"?`)) {
        handleDeleteCategory(categoryId)
      }
    })
  })

  // Save Category button
  const saveCategoryBtn = document.getElementById("save-category-btn")
  if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener("click", handleSaveCategory)
  }
}

/**
 * Set up reports events
 */
function setupReportsEvents() {
  // Set up report filters
  const reportStatusFilter = document.getElementById("report-status-filter")
  const reportTypeFilter = document.getElementById("report-type-filter")
  const reportDateFilter = document.getElementById("report-date-filter")

  if (reportStatusFilter) reportStatusFilter.addEventListener("change", loadReportsData)
  if (reportTypeFilter) reportTypeFilter.addEventListener("change", loadReportsData)
  if (reportDateFilter) reportDateFilter.addEventListener("change", loadReportsData)
}

/**
 * Set up users events
 */
function setupUsersEvents() {
  // Set up user filters
  const userRoleFilter = document.getElementById("user-role-filter")
  const userStatusFilter = document.getElementById("user-status-filter")
  const userSearch = document.getElementById("user-search")

  if (userRoleFilter) userRoleFilter.addEventListener("change", loadUsersData)
  if (userStatusFilter) userStatusFilter.addEventListener("change", loadUsersData)
  if (userSearch) userSearch.addEventListener("input", debounce(loadUsersData, 500))
}

/**
 * Set up products events
 */
function setupProductsEvents() {
  // Set up product filters
  const productCategoryFilter = document.getElementById("product-category-filter")
  const productStatusFilter = document.getElementById("product-status-filter")
  const productPriceFilter = document.getElementById("product-price-filter")
  const productSearch = document.getElementById("product-search")

  if (productCategoryFilter) productCategoryFilter.addEventListener("change", loadProductsData)
  if (productStatusFilter) productStatusFilter.addEventListener("change", loadProductsData)
  if (productPriceFilter) productPriceFilter.addEventListener("change", loadProductsData)
  if (productSearch) productSearch.addEventListener("input", debounce(loadProductsData, 500))
}

/**
 * Set up categories events
 */
function setupCategoriesEvents() {
  // Already set up in setupCategoryButtons
}

/**
 * Handle save category
 */
async function handleSaveCategory() {
  try {
    // Get form data
    const categoryId = document.getElementById("category-id").value
    const categoryName = document.getElementById("category-name").value
    const categoryDescription = document.getElementById("category-description").value

    if (!categoryName) {
      showToast("Por favor, ingresa un nombre para la categoría", "error")
      return
    }

    // Show loading state
    const saveButton = document.getElementById("save-category-btn")
    if (saveButton) {
      saveButton.disabled = true
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'
    }

    // Prepare category data
    const categoryData = {
      name: categoryName,
      description: categoryDescription,
    }

    // Send request (create or update)
    if (categoryId) {
      // Update existing category
      await apiService.put(`/api/categories/${categoryId}`, categoryData)
      showToast("Categoría actualizada exitosamente", "success")
    } else {
      // Create new category
      await apiService.post("/api/categories", categoryData)
      showToast("Categoría creada exitosamente", "success")
    }

    // Close modal
    const modalElement = document.getElementById("categoryModal")
    const modal = bootstrap.Modal.getInstance(modalElement)
    if (modal) {
      modal.hide()
    }

    // Reload categories data
    await loadCategoriesData()
  } catch (error) {
    console.error("Error saving category:", error)
    showToast("Error al guardar la categoría", "error")
  } finally {
    // Reset button state
    const saveButton = document.getElementById("save-category-btn")
    if (saveButton) {
      saveButton.disabled = false
      saveButton.innerHTML = "Guardar"
    }
  }
}

/**
 * Handle delete category
 */
async function handleDeleteCategory(categoryId) {
  try {
    // Send delete request
    await apiService.delete(`/api/categories/${categoryId}`)

    // Show success message
    showToast("Categoría eliminada exitosamente", "success")

    // Reload categories data
    await loadCategoriesData()
  } catch (error) {
    console.error("Error deleting category:", error)
    showToast("Error al eliminar la categoría", "error")
  }
}

/**
 * Format date for display
 */
function formatDate(date) {
  const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  return date.toLocaleDateString("es-MX", options)
}

/**
 * Format product condition
 */
function formatCondition(condition) {
  switch (condition?.toLowerCase()) {
    case "new":
      return "Nuevo"
    case "like_new":
      return "Como nuevo"
    case "good":
      return "En buen estado"
    case "used":
      return "Con uso"
    case "repair":
      return "Para reparar"
    default:
      return "No especificado"
  }
}

/**
 * Get star rating HTML
 */
function getStarRating(rating) {
  const roundedRating = Math.round(rating * 2) / 2 // Round to nearest 0.5
  let starsHtml = ""

  for (let i = 1; i <= 5; i++) {
    if (i <= roundedRating) {
      starsHtml += '<i class="fas fa-star text-warning"></i>'
    } else if (i - 0.5 === roundedRating) {
      starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>'
    } else {
      starsHtml += '<i class="far fa-star text-warning"></i>'
    }
  }

  return `${starsHtml} <span class="ms-1">${rating.toFixed(1)}</span>`
}

/**
 * Debounce utility function
 */
function debounce(func, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

