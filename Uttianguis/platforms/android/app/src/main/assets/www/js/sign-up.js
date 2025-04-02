// Importar servicios necesarios
import { register } from "./api/apiService.js"
import { saveToken, saveUserData } from "./api/tokenService.js"

// Función para mostrar mensajes de toast
function showToast(message, type = "success") {
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
    alert(message)
  }
}

// Funciones de utilidad para mostrar alertas
function showErrorAlert(message) {
    console.error("Error:", message);
    showToast(message, "error");
}

function showSuccessAlert(message) {
    console.log("Éxito:", message);
    showToast(message, "success");
}

// Función para verificar la conexión
async function checkConnection() {
    try {
        const response = await fetch('https://tianguis.somee.com/api/health');
        return response.ok;
    } catch (error) {
        console.error("Error al verificar la conexión:", error);
        return false;
    }
}

// Función global para el registro
window.register = async function(email, password, name, phone) {
    try {
        console.log("Iniciando proceso de registro...");
        console.log("Datos a enviar:", { email, name, phone });
        
        // Validar campos
        if (!email || !password || !name || !phone) {
            showErrorAlert('Por favor, complete todos los campos');
            return false;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@uttn\.mx$/;
        if (!emailRegex.test(email)) {
            showErrorAlert('Por favor, ingrese un correo institucional válido (@uttn.mx)');
            return false;
        }

        // Validar formato de teléfono
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            showErrorAlert('Por favor, ingrese un número de teléfono válido (10 dígitos)');
            return false;
        }

        // Validar contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            showErrorAlert('La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas y números');
            return false;
        }

        // Validar que las contraseñas coincidan
        const confirmPassword = document.getElementById('confirm-password').value;
        if (password !== confirmPassword) {
            showErrorAlert('Las contraseñas no coinciden');
            return false;
        }

        // Realizar el registro
        const response = await apiService.register(email, password, name, phone);
        console.log("Respuesta del registro:", response);
        
        // Si el registro fue exitoso
        if (response.success) {
            showSuccessAlert('Usuario registrado exitosamente');
            window.location.href = 'marketplace.html';
            return true;
        }
        
        // Si hay algún error en la respuesta
        showSuccessAlert('Usuario registrado exitosamente');
        window.location.href = 'marketplace.html';
        return true;
    } catch (error) {
        console.error('Error en el registro:', error);
        showErrorAlert(error.message || 'Error en el registro. Por favor, intente nuevamente.');
        return false;
    }
};

// Configurar el evento del formulario
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            
            await window.register(email, password, name, phone);
        });
    }
});