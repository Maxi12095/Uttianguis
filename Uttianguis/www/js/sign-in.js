//signin.js
// Importa los servicios necesarios
import apiService from "./api/apiService.js";
import tokenService from "./api/tokenService.js";

// Función para mostrar mensajes de error
function showErrorAlert(message) {
    if (window.Toastify) {
        window.Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "#e74c3c",
        }).showToast();
    } else {
        alert(message);
    }
}

// Función para mostrar mensajes de éxito
function showSuccessAlert(message) {
    if (window.Toastify) {
        window.Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "#2ecc71",
        }).showToast();
    } else {
        alert(message);
    }
}

// Función para manejar el inicio de sesión
async function handleLogin(email, password) {
    // Obtener el botón de submit
    const submitButton = document.querySelector("#login-form button[type='submit']");
    const originalButtonText = submitButton.innerHTML;

    try {
        // Validación básica
        if (!email || !password) {
            showErrorAlert("Por favor, complete todos los campos");
            return false;
        }

        // Mostrar indicador de carga
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando sesión...';

        // Llamar a la API
        const loginResult = await apiService.login(email, password);

        // Verificar la respuesta
        if (!loginResult || !loginResult.token) {
            throw new Error("No se recibió el token de autenticación");
        }

        // Guardar el token
        const tokenSaved = tokenService.setToken(loginResult.token);
        if (!tokenSaved) {
            throw new Error("Error al guardar el token");
        }

        // Guardar datos del usuario
        if (loginResult.user) {
            tokenService.saveUserData(loginResult.user);
        }

        // Mostrar mensaje de éxito
        showSuccessAlert("Inicio de sesión exitoso");

        // Redirigir después de un breve delay
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get("redirect") || "marketplace.html";
            window.location.href = redirectUrl;
        }, 1500);

        return true;
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        showErrorAlert(error.message || "Error al iniciar sesión");
        return false;
    } finally {
        // Restaurar el botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
}

// Configurar el formulario cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            await handleLogin(email, password);
        });
    } else {
        console.error("No se encontró el formulario de inicio de sesión");
    }
});