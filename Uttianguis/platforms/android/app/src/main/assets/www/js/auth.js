// Auth.js - Maneja la autenticación de usuarios
import tokenService, { 
  saveToken, 
  saveUserData, 
  clearAuth, 
  isAuthenticated, 
  getUserData 
} from "./api/tokenService.js"
import apiService from "./api/apiService.js"
import { validateSellAccess, validateAuthAndHideLoginElements } from "./validation.js"

// Función para mostrar mensajes de toast
export function showToast(message, type = "success") {
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
    // Crear elemento toast con Bootstrap como fallback
    const toast = document.createElement("div")
    toast.className = `toast align-items-center text-white bg-${type === "success" ? "success" : "danger"} border-0 position-fixed bottom-0 end-0 m-3`
    toast.setAttribute("role", "alert")
    toast.setAttribute("aria-live", "assertive")
    toast.setAttribute("aria-atomic", "true")

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `

    document.body.appendChild(toast)
    // Usar la versión global de Bootstrap
    if (window.bootstrap) {
      const bsToast = new window.bootstrap.Toast(toast, { autohide: true, delay: 5000 })
      bsToast.show()

      toast.addEventListener("hidden.bs.toast", () => {
        document.body.removeChild(toast)
      })
    } else {
      // Fallback si Bootstrap no está disponible
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 5000)
    }
  }
}

/**
 * Initialize authentication for the page
 */
export function initAuth() {
  // Mostrar/ocultar elementos según el estado de autenticación
  updateAuthUI()

  // Configurar eventos de autenticación
  setupAuthEvents()
}

/**
 * Initialize authentication UI elements
 */
function initAuthUI() {
  const isAuthenticated = tokenService.isAuthenticated()
  const isAdmin = tokenService.isAdmin()

  // Elements that should only be visible when logged in
  const loggedInElements = document.querySelectorAll(".auth-only-logged-in")

  // Elements that should only be visible when logged out
  const loggedOutElements = document.querySelectorAll(".auth-only-logged-out")

  // Elements that should only be visible for admins
  const adminOnlyElements = document.querySelectorAll(".admin-only")

  // Update UI based on authentication state
  if (isAuthenticated) {
    // Show logged in elements
    loggedInElements.forEach((el) => {
      el.style.display = "block"
    })

    // Hide logged out elements
    loggedOutElements.forEach((el) => {
      el.style.display = "none"
    })

    // Update user info in navbar
    updateUserInfo()

    // Show/hide admin elements
    adminOnlyElements.forEach((el) => {
      el.style.display = isAdmin ? "block" : "none"
    })
  } else {
    // Show logged out elements
    loggedOutElements.forEach((el) => {
      el.style.display = "block"
    })

    // Hide logged in elements
    loggedInElements.forEach((el) => {
      el.style.display = "none"
    })

    // Hide admin elements
    adminOnlyElements.forEach((el) => {
      el.style.display = "none"
    })
  }
}

// Función para actualizar la UI según el estado de autenticación
function updateAuthUI() {
  const isLoggedIn = isAuthenticated()

  // Elementos que solo se muestran cuando el usuario está autenticado
  document.querySelectorAll(".auth-only-logged-in").forEach((el) => {
    el.style.display = isLoggedIn ? "block" : "none"
  })

  // Elementos que solo se muestran cuando el usuario NO está autenticado
  document.querySelectorAll(".auth-only-logged-out").forEach((el) => {
    el.style.display = isLoggedIn ? "none" : "block"
  })

  // Actualizar nombre de usuario si está autenticado
  if (isLoggedIn) {
    const userData = getUserData()
    const usernameElements = document.querySelectorAll("#username")
    usernameElements.forEach((el) => {
      el.textContent = userData?.name || "Usuario"
    })
  }
}

/**
 * Update UI elements based on authentication status
 * @param {boolean} isAuthenticated - Whether user is authenticated
 */
function updateAuthUI_old(isAuthenticated) {
  const loggedInElements = document.querySelectorAll(".auth-only-logged-in")
  const loggedOutElements = document.querySelectorAll(".auth-only-logged-out")

  if (isAuthenticated) {
    // Show elements for logged-in users
    loggedInElements.forEach((el) => {
      el.style.display = "block"
    })

    // Hide elements for logged-out users
    loggedOutElements.forEach((el) => {
      el.style.display = "none"
    })

    // Update user information
    const user = apiService.getCurrentUser()
    if (user) {
      const usernameElements = document.querySelectorAll("#username, #navbar-username")
      usernameElements.forEach((el) => {
        if (el) el.textContent = user.name || user.email
      })

      // Update avatar if exists
      const avatarElements = document.querySelectorAll("#navbar-avatar, #profile-image")
      avatarElements.forEach((el) => {
        if (el && user.avatarUrl) {
          el.src = user.avatarUrl
        }
      })
    }
  } else {
    // Hide elements for logged-in users
    loggedInElements.forEach((el) => {
      el.style.display = "none"
    })

    // Show elements for logged-out users
    loggedOutElements.forEach((el) => {
      el.style.display = "block"
    })
  }

  // Additional check for admin sections
  if (isAuthenticated && apiService.isAdmin()) {
    const adminElements = document.querySelectorAll(".auth-only-admin")
    adminElements.forEach((el) => {
      el.style.display = "block"
    })
  } else {
    const adminElements = document.querySelectorAll(".auth-only-admin")
    adminElements.forEach((el) => {
      el.style.display = "none"
    })
  }
}

/**
 * Update user information in the UI
 */
function updateUserInfo() {
  const userData = tokenService.getUserData()

  if (!userData) return

  // Update username in navbar
  const usernameElements = document.querySelectorAll("#username, #navbar-username")
  usernameElements.forEach((el) => {
    if (el) el.textContent = userData.name
  })

  // Update user avatar in navbar
  const avatarElements = document.querySelectorAll("#navbar-avatar")
  avatarElements.forEach((el) => {
    if (el && userData.profileImageUrl) {
      el.src = userData.profileImageUrl
    }
  })
}

// Configurar eventos relacionados con la autenticación
function setupAuthEvents() {
  // Evento de logout
  const logoutButtons = document.querySelectorAll("#logout-button")
  logoutButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })
  })

  // Formulario de login
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Formulario de registro
  const registerForm = document.getElementById("register-form")
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister)
  }
}

/**
 * Set up logout button functionality
 */
function setupLogoutButton() {
  const logoutButtons = document.querySelectorAll("#logout-button")

  logoutButtons.forEach((button) => {
    if (button) {
      button.addEventListener("click", (e) => {
        e.preventDefault()
        apiService.logout()
        showToast("Sesión cerrada correctamente")
        // Redirect to home page
        window.location.href = "index.html"
      })
    }
  })
}

// Función para manejar el login
async function handleLogin(e) {
  e.preventDefault()
  
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  
  try {
    const response = await apiService.login(email, password)
    
    if (response && response.token) {
      saveToken(response.token)
      saveUserData(response.user)
      showToast("Inicio de sesión exitoso")
      
      // Redirigir si hay una URL de redirección
      const urlParams = new URLSearchParams(window.location.search)
      const redirectUrl = urlParams.get("redirect")
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        window.location.href = "index.html"
      }
    } else {
      throw new Error("No se recibió el token de autenticación")
    }
  } catch (error) {
    console.error("Error en login:", error)
    showToast(error.message || "Error al iniciar sesión", "error")
  }
}

// Función para manejar el registro
async function handleRegister(e) {
  e.preventDefault()
  
  const formData = {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value
  }
  
  try {
    const response = await apiService.register(formData)
    showToast("Registro exitoso. Por favor, inicia sesión.")
    window.location.href = "sign-in.html"
  } catch (error) {
    console.error("Error en registro:", error)
    showToast(error.message || "Error al registrar usuario", "error")
  }
}

/**
 * Set up registration form functionality
 */
function setupRegisterForm() {
  const registerForm = document.getElementById("register-form")

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      // Get form data
      const name = document.getElementById("name").value
      const email = document.getElementById("email").value
      const phone = document.getElementById("phone").value
      const password = document.getElementById("password").value
      const confirmPassword = document.getElementById("confirm-password").value

      // Validate passwords match
      if (password !== confirmPassword) {
        showToast("Las contraseñas no coinciden", "error")
        return
      }

      // Validate password strength
      if (password.length < 8) {
        showToast("La contraseña debe tener al menos 8 caracteres", "error")
        return
      }

      // Disable submit button to prevent multiple submits
      const submitButton = registerForm.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = true
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...'
      }

      try {
        // Register user
        const userData = {
          name,
          email,
          phone,
          password,
        }

        await apiService.register(userData)

        showToast("Cuenta creada exitosamente")

        // Redirect to login page
        window.location.href = "sign-in.html"
      } catch (error) {
        console.error("Registration error:", error)
        showToast(error.message || "Error al crear la cuenta", "error")

        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false
          submitButton.innerHTML = '<i class="fas fa-user-plus me-2"></i>Crear Cuenta'
        }
      }
    })
  }
}

// Función para cerrar sesión
export function logout() {
  // Limpiar datos de autenticación
  clearAuth()

  // Actualizar UI
  updateAuthUI()

  // Mostrar mensaje
  showToast("Sesión cerrada correctamente")

  // Redirigir a la página de inicio
  window.location.href = "index.html"
}

// Initialize authentication when DOM is loaded
document.addEventListener("DOMContentLoaded", initAuth)

// Export functions for use in other modules
export { updateAuthUI }

// Función para actualizar la navegación según el estado de autenticación
export function updateNavigation() {
  // Validar y ocultar elementos de inicio de sesión
  validateAuthAndHideLoginElements();

  const isAuthenticated = tokenService.isAuthenticated();
  const userLinks = document.querySelectorAll(".user-links");
  const sellProductLinks = document.querySelectorAll(".sell-product-link");

  userLinks.forEach(link => {
    if (isAuthenticated) {
      link.style.display = "block";
    } else {
      link.style.display = "none";
    }
  });

  sellProductLinks.forEach(link => {
    if (isAuthenticated) {
      link.style.display = "block";
      // Agregar manejador de eventos para validar acceso
      link.addEventListener("click", (e) => {
        if (!validateSellAccess()) {
          e.preventDefault();
        }
      });
    } else {
      link.style.display = "none";
      link.href = "sign-in.html?redirect=sell-product.html";
    }
  });
}

// Función para verificar autenticación en páginas protegidas
export function checkAuth() {
  if (!tokenService.isAuthenticated()) {
    const currentPage = window.location.pathname.split("/").pop();
    window.location.href = `sign-in.html?redirect=${currentPage}`;
    return false;
  }
  return true;
}

// Exportar funciones globales
window.logout = logout;
window.checkAuth = checkAuth;

