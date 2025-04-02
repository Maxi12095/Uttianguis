// Convert to ES module
import tokenService from './tokenService.js';
import apiService from './apiService.js';

// No changes to imports...

// Función para manejar el inicio de sesión
async function handleLogin(email, password) {
  try {
    if (!email || !password) {
      throw new Error('El email y la contraseña son requeridos');
    }

    const result = await apiService.login(email, password);
    
    if (!result) {
      throw new Error('No se recibió respuesta del servidor');
    }
    
    if (!result.token) {
      throw new Error('No se recibió un token válido');
    }
    
    // Store the token
    tokenService.setToken(result.token);
    
    if (result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    
    // Limpiar datos de sesión en caso de error
    tokenService.removeToken();
    localStorage.removeItem('user');
    
    if (window.Toastify) {
      Toastify({
        text: error.message || 'Error en inicio de sesión',
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: "#e74c3c",
      }).showToast();
    } else {
      alert(error.message || 'Error en inicio de sesión');
    }
    
    throw error;
  }
}

// No changes to other functions...

// Export functions for use in other modules
const authService = {
  login: handleLogin,
  isAuthenticated: tokenService.isAuthenticated,
  logout: tokenService.logout,
  getToken: tokenService.getToken,
  setToken: tokenService.setToken,
  removeToken: tokenService.removeToken
};

export default authService;