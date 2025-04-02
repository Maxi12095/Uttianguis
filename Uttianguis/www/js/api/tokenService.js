// Servicio para manejar el token de API
const tokenService = {
  getToken: function() {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      console.error('Error al obtener token:', e);
      return null;
    }
  },
  
  setToken: function(token) {
    try {
      // Validar el token antes de guardarlo
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('Intento de guardar token inválido');
        return false;
      }
      localStorage.setItem('token', token);
      return true;
    } catch (e) {
      console.error('Error al guardar token:', e);
      return false;
    }
  },
  
  saveToken: function(token) {
    return this.setToken(token);
  },
  
  removeToken: function() {
    try {
      localStorage.removeItem('token');
      return true;
    } catch (e) {
      console.error('Error al eliminar token:', e);
      return false;
    }
  },
  
  isAuthenticated: function() {
    try {
      const token = localStorage.getItem('token');
      return token !== null && token !== undefined && token !== '';
    } catch (e) {
      console.error('Error al verificar autenticación:', e);
      return false;
    }
  },

  getUserData: function() {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (e) {
      console.error('Error al obtener datos de usuario:', e);
      return null;
    }
  },

  saveUserData: function(userData) {
    try {
      if (!userData) {
        console.error('Datos de usuario inválidos');
        return false;
      }
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (e) {
      console.error('Error al guardar datos de usuario:', e);
      return false;
    }
  },

  clearAuth: function() {
    try {
      this.removeToken();
      localStorage.removeItem('user');
      return true;
    } catch (e) {
      console.error('Error al limpiar autenticación:', e);
      return false;
    }
  },

  logout: function() {
    try {
      this.clearAuth();
      window.location.href = 'sign-in.html';
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  }
};

// Exportar el objeto completo por defecto
export default tokenService;

// Exportar funciones individuales
export const { 
  isAuthenticated, 
  getUserData, 
  saveToken,
  saveUserData, 
  clearAuth, 
  getToken, 
  removeToken 
} = tokenService;