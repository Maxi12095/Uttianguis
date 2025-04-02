import { showToast } from './auth.js';

// Función para limpiar todas las cookies
function clearCookies() {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
}

// Función de logout
export async function logout() {
    try {
        // Limpiar localStorage
        localStorage.clear();
        
        // Limpiar sessionStorage
        sessionStorage.clear();
        
        // Limpiar cookies
        clearCookies();

        // Mostrar mensaje de éxito
        showToast('Sesión cerrada correctamente', 'success');

        // Redirigir al usuario a la página de inicio de sesión
        window.location.href = 'sign-in.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión', 'error');
    }
}

// Configurar los botones de logout cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Manejar botones con id="logout-button"
    const logoutButtons = document.querySelectorAll('#logout-button');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });

    // Manejar enlaces con onclick="logout()"
    const logoutLinks = document.querySelectorAll('a[onclick="logout()"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
});

// Hacer la función logout disponible globalmente
window.logout = logout;
