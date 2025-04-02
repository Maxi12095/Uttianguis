// Utility functions for the application

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 */
function showToast(message, type = "info") {
    // Check if Bootstrap is available
    if (typeof bootstrap !== "undefined") {
      const toastEl = document.getElementById("toast")
      if (toastEl) {
        const toastBody = toastEl.querySelector(".toast-body")
  
        // Set toast color based on type
        toastEl.className = "toast"
        switch (type) {
          case "success":
            toastEl.classList.add("bg-success", "text-white")
            break
          case "error":
            toastEl.classList.add("bg-danger", "text-white")
            break
          case "warning":
            toastEl.classList.add("bg-warning")
            break
          default:
            toastEl.classList.add("bg-info", "text-white")
        }
  
        if (toastBody) {
          toastBody.textContent = message
        }
  
        const toast = new bootstrap.Toast(toastEl)
        toast.show()
      } else {
        // Fallback if toast element doesn't exist
        alert(message)
      }
    } else {
      // Fallback if Bootstrap is not available
      alert(message)
    }
  }
  
  /**
   * Format a date string to a more readable format
   * @param {string} dateString - The date string to format
   * @returns {string} - The formatted date string
   */
  function formatDate(dateString) {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  /**
   * Format a price to a currency string
   * @param {number} price - The price to format
   * @param {string} currency - The currency code (default: USD)
   * @returns {string} - The formatted price string
   */
  function formatPrice(price, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price)
  }
  
  /**
   * Truncate a string to a specified length
   * @param {string} str - The string to truncate
   * @param {number} length - The maximum length
   * @returns {string} - The truncated string
   */
  function truncateString(str, length = 100) {
    if (str.length <= length) return str
    return str.substring(0, length) + "..."
  }
  
  /**
   * Validate an email address format
   * @param {string} email - The email to validate
   * @returns {boolean} - Whether the email is valid
   */
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
  
  /**
   * Get URL parameters as an object
   * @returns {Object} - The URL parameters
   */
  function getUrlParams() {
    const params = {}
    new URLSearchParams(window.location.search).forEach((value, key) => {
      params[key] = value
    })
    return params
  }
  
  // Export the functions if using ES modules
  export { showToast, formatDate, formatPrice, truncateString, isValidEmail, getUrlParams }
  
  