// validation.js
import tokenService from "./api/tokenService.js";

/**
 * Valida si el usuario tiene acceso para vender productos
 * @returns {boolean} true si el usuario está autenticado, false si no
 */
export function validateSellAccess() {
    // Verificar si el usuario está autenticado
    if (!tokenService.isAuthenticated()) {
        window.location.href = "sign-in.html?redirect=sell-product.html";
        return false;
    }

    // Obtener el usuario del localStorage
    const user = tokenService.getUserData();
    
    // Verificar si el usuario existe
    if (!user) {
        console.error("No se encontraron datos del usuario");
        return false;
    }

    // Si el usuario está autenticado, permitir acceso
    return true;
}

/**
 * Valida si existe un token de autenticación y oculta elementos de inicio de sesión
 * @returns {void}
 */
export function validateAuthAndHideLoginElements() {
    // Verificar si hay un token
    if (tokenService.isAuthenticated()) {
        // Obtener todos los elementos que enlazan a sign-in.html
        const loginElements = document.querySelectorAll('a[href*="sign-in.html"]');
        
        // Ocultar cada elemento encontrado
        loginElements.forEach(element => {
            element.style.display = 'none';
        });

        // Obtener y ocultar elementos con la clase auth-only-logged-out
        const loggedOutElements = document.querySelectorAll('.auth-only-logged-out');
        loggedOutElements.forEach(element => {
            element.style.display = 'none';
        });

        // Mostrar elementos con la clase auth-only-logged-in
        const loggedInElements = document.querySelectorAll('.auth-only-logged-in');
        loggedInElements.forEach(element => {
            element.style.display = 'block';
        });
    } else {
        // Si no está autenticado, mostrar elementos de inicio de sesión
        const loggedOutElements = document.querySelectorAll('.auth-only-logged-out');
        loggedOutElements.forEach(element => {
            element.style.display = 'block';
        });

        // Ocultar elementos que requieren autenticación
        const loggedInElements = document.querySelectorAll('.auth-only-logged-in');
        loggedInElements.forEach(element => {
            element.style.display = 'none';
        });
    }
}
