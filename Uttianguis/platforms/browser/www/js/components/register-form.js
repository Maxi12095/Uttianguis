/**
 * Component for the registration form
 */
;(() => {
  // Dependencies
  const { register, validateUTTNEmail, validatePhoneNumber, isBlockedEmailDomain, getAvailableRoles } =
    window.UserService
  const { showToast, validatePassword } = window.Utils

  // DOM elements
  let registerForm
  let nameInput
  let emailInput
  let phoneInput
  let roleSelect
  let passwordInput
  let confirmPasswordInput
  let submitButton
  let errorContainer

  /**
   * Initialize the component
   */
  function init() {
    // Get DOM elements
    registerForm = document.getElementById("register-form")
    nameInput = document.getElementById("name")
    emailInput = document.getElementById("email")
    phoneInput = document.getElementById("phone")
    roleSelect = document.getElementById("role")
    passwordInput = document.getElementById("password")
    confirmPasswordInput = document.getElementById("confirm-password")
    submitButton = document.getElementById("register-button")
    errorContainer = document.getElementById("error-container")

    // Fill role selector
    populateRoleSelect()

    // Set up events
    registerForm.addEventListener("submit", handleSubmit)
    emailInput.addEventListener("blur", validateEmailField)
    phoneInput.addEventListener("blur", validatePhoneField)
    passwordInput.addEventListener("blur", validatePasswordField)
    confirmPasswordInput.addEventListener("blur", validateConfirmPasswordField)
  }

  /**
   * Fill role selector with available options
   */
  function populateRoleSelect() {
    if (!roleSelect) return

    // Clear existing options
    roleSelect.innerHTML = ""

    // Add default option
    const defaultOption = document.createElement("option")
    defaultOption.value = ""
    defaultOption.textContent = "Select your role"
    defaultOption.disabled = true
    defaultOption.selected = true
    roleSelect.appendChild(defaultOption)

    // Add available roles (excluding admin)
    const roles = getAvailableRoles().filter((role) => role.id !== "admin")
    roles.forEach((role) => {
      const option = document.createElement("option")
      option.value = role.id
      option.textContent = role.name
      roleSelect.appendChild(option)
    })
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async function handleSubmit(event) {
    event.preventDefault()

    // Validate all fields
    if (!validateForm()) {
      return
    }

    // Disable button to prevent multiple submissions
    submitButton.disabled = true
    submitButton.textContent = "Registering..."

    try {
      // Create object with user data
      const userData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        role: roleSelect ? roleSelect.value : "alumno",
        password: passwordInput.value,
      }

      // Send registration request
      const response = await register(userData)

      // Show success message
      showToast("Registration successful. Welcome to UTTianguis!", "success")

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "index.html"
      }, 1500)
    } catch (error) {
      // Show error message
      showError(error.message || "Error registering user")

      // Enable button again
      submitButton.disabled = false
      submitButton.textContent = "Register"
    }
  }

  /**
   * Validate all form fields
   * @returns {boolean} - True if all fields are valid, false otherwise
   */
  function validateForm() {
    let isValid = true

    // Validate name
    if (!nameInput.value.trim()) {
      showFieldError(nameInput, "Name is required")
      isValid = false
    } else {
      clearFieldError(nameInput)
    }

    // Validate email
    if (!validateEmailField()) {
      isValid = false
    }

    // Validate phone
    if (!validatePhoneField()) {
      isValid = false
    }

    // Validate role
    if (roleSelect && !roleSelect.value) {
      showFieldError(roleSelect, "You must select your role at the university")
      isValid = false
    } else {
      clearFieldError(roleSelect)
    }

    // Validate password
    if (!validatePasswordField()) {
      isValid = false
    }

    // Validate password confirmation
    if (!validateConfirmPasswordField()) {
      isValid = false
    }

    return isValid
  }

  /**
   * Validate email field
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateEmailField() {
    const email = emailInput.value.trim()

    if (!email) {
      showFieldError(emailInput, "Email is required")
      return false
    }

    if (!email.endsWith("@uttn.mx")) {
      showFieldError(emailInput, "Email must be from the @uttn.mx domain")
      return false
    }

    if (isBlockedEmailDomain(email)) {
      const domain = email.split("@")[1]
      showFieldError(emailInput, `Emails from ${domain} are not allowed. Use your institutional email @uttn.mx`)
      return false
    }

    if (!validateUTTNEmail(email)) {
      showFieldError(emailInput, "Email format is not valid")
      return false
    }

    clearFieldError(emailInput)
    return true
  }

  /**
   * Validate phone field
   * @returns {boolean} - True if valid, false otherwise
   */
  function validatePhoneField() {
    const phone = phoneInput.value.trim()

    if (!phone) {
      showFieldError(phoneInput, "Phone number is required")
      return false
    }

    if (!validatePhoneNumber(phone)) {
      showFieldError(phoneInput, "Phone number must have 10 digits")
      return false
    }

    clearFieldError(phoneInput)
    return true
  }

  /**
   * Validate password field
   * @returns {boolean} - True if valid, false otherwise
   */
  function validatePasswordField() {
    const password = passwordInput.value

    if (!password) {
      showFieldError(passwordInput, "Password is required")
      return false
    }

    if (password.length < 6) {
      showFieldError(passwordInput, "Password must be at least 6 characters")
      return false
    }

    clearFieldError(passwordInput)
    return true
  }

  /**
   * Validate password confirmation field
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateConfirmPasswordField() {
    const password = passwordInput.value
    const confirmPassword = confirmPasswordInput.value

    if (!confirmPassword) {
      showFieldError(confirmPasswordInput, "You must confirm your password")
      return false
    }

    if (password !== confirmPassword) {
      showFieldError(confirmPasswordInput, "Passwords don't match")
      return false
    }

    clearFieldError(confirmPasswordInput)
    return true
  }

  /**
   * Show error on a specific field
   * @param {HTMLElement} field - Field with error
   * @param {string} message - Error message
   */
  function showFieldError(field, message) {
    // Add error class to field
    field.classList.add("error")

    // Find or create error container
    let errorElement = field.nextElementSibling
    if (!errorElement || !errorElement.classList.contains("error-message")) {
      errorElement = document.createElement("div")
      errorElement.className = "error-message"
      field.parentNode.insertBefore(errorElement, field.nextSibling)
    }

    // Set error message
    errorElement.textContent = message
  }

  /**
   * Clear error from a field
   * @param {HTMLElement} field - Field to clear
   */
  function clearFieldError(field) {
    // Remove error class
    field.classList.remove("error")

    // Remove error message if it exists
    const errorElement = field.nextElementSibling
    if (errorElement && errorElement.classList.contains("error-message")) {
      errorElement.textContent = ""
    }
  }

  /**
   * Show general error message
   * @param {string} message - Error message
   */
  function showError(message) {
    errorContainer.textContent = message
    errorContainer.style.display = "block"
  }

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", init)

  // Initialize when Cordova is ready
  document.addEventListener("deviceready", init)
})()

