// Validar que el correo sea institucional (@uttn.mx)
export const validateEmail = (email) => {
  const regex = /@uttn\.mx$/i
  return regex.test(email)
}

// Validar número de teléfono (10 dígitos)
export const validatePhone = (phone) => {
  const regex = /^\d{10}$/
  return regex.test(phone)
}

// Formatear número de teléfono para WhatsApp
export const formatPhoneForWhatsApp = (phone) => {
  // Eliminar cualquier caracter que no sea dígito
  const cleanPhone = phone.replace(/\D/g, "")

  // Si el número ya tiene el código de país (52), usarlo directamente
  if (cleanPhone.startsWith("52") && cleanPhone.length === 12) {
    return cleanPhone
  }

  // Si el número tiene 10 dígitos, agregar el código de país de México (52)
  if (cleanPhone.length === 10) {
    return `52${cleanPhone}`
  }

  // Si no cumple con los formatos anteriores, devolver el número original
  return cleanPhone
}

