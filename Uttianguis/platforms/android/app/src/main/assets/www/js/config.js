// Configuración global de la aplicación
const CONFIG = {
  // URL base de la API
  API_URL: "https://tianguis.somee.com/api",

  // Tiempo de expiración del token en milisegundos (24 horas)
  TOKEN_EXPIRATION: 24 * 60 * 60 * 1000,

  // Nombre del token en localStorage
  TOKEN_KEY: "uttianguis_token",

  // Nombre del usuario en localStorage
  USER_KEY: "uttianguis_user",

  // Configuración de notificaciones
  NOTIFICATION_REFRESH_INTERVAL: 60000, // 1 minuto
}

// Exportar la configuración como módulo ES6
export default CONFIG

