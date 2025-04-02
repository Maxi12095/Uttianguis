// marketplace.js - Maneja la funcionalidad de la página de marketplace
import apiService from "./api/apiService.js"
import tokenService from "./api/tokenService.js"

// Variables globales
let currentFilters = {
  categories: [],
  conditions: [],
  location: "",
  minPrice: "",
  maxPrice: "",
  rating: 0,
  inStock: false,
  sortBy: "newest",
  search: "",
  page: 1,
  pageSize: 12,
}

let favorites = []
let viewMode = "grid"
let totalPages = 0

/**
 * Función para mostrar mensajes de toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (success, error)
 */
function showToast(message, type = "success") {
  // Crear elemento toast
  const toast = document.createElement("div")
  toast.className = `toast align-items-center text-white bg-${type === "success" ? "success" : "danger"} border-0 position-fixed bottom-0 end-0 m-3`
  toast.setAttribute("role", "alert")
  toast.setAttribute("aria-live", "assertive")
  toast.setAttribute("aria-atomic", "true")

  // Contenido del toast
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `

  // Añadir al DOM
  document.body.appendChild(toast)

  // Inicializar y mostrar toast
  const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 })
  bsToast.show()

  // Eliminar del DOM cuando se oculte
  toast.addEventListener("hidden.bs.toast", () => {
    document.body.removeChild(toast)
  })
}

/**
 * Initialize marketplace page
 */
async function initMarketplacePage() {
  try {
    // Cargar categorías
    await loadCategories()

    // Cargar productos
    await loadProducts()

    // Configurar eventos
    setupMarketplaceEvents()

    // Obtener parámetros de URL
    const urlParams = new URLSearchParams(window.location.search)

    // Aplicar filtros de URL
    if (urlParams.has("category")) {
      const category = urlParams.get("category")
      const categoryCheckbox = document.getElementById(`category-${category}`)
      if (categoryCheckbox) {
        categoryCheckbox.checked = true
        currentFilters.categories = [category]
        await applyFilters()
      }
    }

    if (urlParams.has("search")) {
      const search = urlParams.get("search")
      const searchInput = document.getElementById("search-input")
      if (searchInput) {
        searchInput.value = search
        currentFilters.search = search
        await applyFilters()
      }
    }

    // Si el usuario está autenticado, cargar favoritos
    if (tokenService.isAuthenticated()) {
      await loadFavorites()
    }
  } catch (error) {
    console.error("Error al inicializar marketplace:", error)
    showToast("Error al cargar la página: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

/**
 * Load categories from API
 */
async function loadCategories() {
  try {
    const categories = await apiService.getCategories()
    console.log("Categorías cargadas:", categories)

    // Actualizar filtro de categorías en productos
    const categoryFilter = document.getElementById("product-category-filter")
    if (categoryFilter) {
      // Mantener la opción por defecto
      const defaultOption = categoryFilter.querySelector('option[value="all"]')
      categoryFilter.innerHTML = ""
      categoryFilter.appendChild(defaultOption)

      // Añadir categorías
      categories.forEach((category) => {
        const option = document.createElement("option")
        option.value = category.key
        option.textContent = category.name
        categoryFilter.appendChild(option)
      })
    }
  } catch (error) {
    console.error("Error al cargar categorías:", error)
    showToast("Error al cargar categorías: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

/**
 * Load products from API
 */
async function loadProducts() {
  try {
    // Mostrar spinner de carga
    document.getElementById("loading-spinner").style.display = "block"
    document.getElementById("products-container").style.display = "none"
    document.getElementById("empty-state").classList.add("d-none")

    console.log("Cargando productos con filtros:", currentFilters)
    const response = await apiService.getProducts(currentFilters)
    console.log("Productos cargados:", response)

    // Ocultar spinner de carga
    document.getElementById("loading-spinner").style.display = "none"

    // Normalizar la respuesta
    let productsData = {
      items: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1
    }

    // Si la respuesta es un array, convertirla al formato esperado
    if (Array.isArray(response)) {
      productsData.items = response
      productsData.totalItems = response.length
    } else if (response && typeof response === 'object') {
      productsData = response
    }

    // Actualizar contador de productos
    document.getElementById("products-count").textContent = productsData.totalItems || productsData.items.length || 0

    // Actualizar total de páginas para paginación
    totalPages = productsData.totalPages || 1

    // Verificar si hay productos
    if (!productsData.items.length) {
      document.getElementById("empty-state").classList.remove("d-none")
      document.getElementById("products-container").style.display = "none"
      return
    }

    // Mostrar contenedor de productos
    document.getElementById("products-container").style.display = "block"

    // Renderizar productos
    renderProducts(productsData.items, document.getElementById("products-container"))

    // Actualizar paginación
    updatePagination(productsData.totalPages || 1, productsData.currentPage || 1)
  } catch (error) {
    console.error("Error al cargar productos:", error)
    document.getElementById("loading-spinner").style.display = "none"
    document.getElementById("empty-state").classList.remove("d-none")
    document.getElementById("products-container").style.display = "none"
    showToast("Error al cargar productos: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

/**
 * Apply filters and reload products
 */
async function applyFilters() {
  try {
    // Actualizar filtros actuales
    updateCurrentFilters()

    // Resetear página a 1
    currentFilters.page = 1

    // Recargar productos
    await loadProducts()

    // Actualizar filtros activos
    updateActiveFilters()
  } catch (error) {
    console.error("Error al aplicar filtros:", error)
    showToast("Error al aplicar filtros: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

/**
 * Update current filters from form
 */
function updateCurrentFilters() {
  // Categorías
  const categoryCheckboxes = document.querySelectorAll("#categories-container .category-checkbox:checked")
  currentFilters.categories = Array.from(categoryCheckboxes).map((cb) => cb.id.replace("category-", ""))

  // Condiciones
  const conditionCheckboxes = document.querySelectorAll('input[id^="condition-"]:checked')
  currentFilters.conditions = Array.from(conditionCheckboxes).map((cb) => cb.id.replace("condition-", ""))

  // Ubicación
  const locationSelect = document.getElementById("campus-location")
  if (locationSelect) {
    currentFilters.location = locationSelect.value
  }

  // Precios
  const minPriceInput = document.getElementById("min-price")
  const maxPriceInput = document.getElementById("max-price")
  if (minPriceInput) currentFilters.minPrice = minPriceInput.value
  if (maxPriceInput) currentFilters.maxPrice = maxPriceInput.value

  // Búsqueda
  const searchInput = document.getElementById("search-input")
  if (searchInput) currentFilters.search = searchInput.value

  // Ordenamiento
  const sortBySelect = document.getElementById("sort-by")
  if (sortBySelect) currentFilters.sortBy = sortBySelect.value

  // Stock
  const inStockCheckbox = document.getElementById("in-stock-only")
  if (inStockCheckbox) currentFilters.inStock = inStockCheckbox.checked
}

/**
 * Load favorites if user is authenticated
 */
async function loadFavorites() {
  try {
    favorites = await apiService.getFavorites()
    console.log("Favoritos cargados:", favorites)
    setupFavoriteButtons()
  } catch (error) {
    console.error("Error al cargar favoritos:", error)
    showToast("Error al cargar favoritos: " + (error.message || "Inténtalo de nuevo"), "error")
  }
}

/**
 * Setup marketplace events
 */
function setupMarketplaceEvents() {
  // View mode buttons
  const gridViewBtn = document.getElementById("grid-view-btn")
  const listViewBtn = document.getElementById("list-view-btn")

  if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener("click", () => setViewMode("grid"))
    listViewBtn.addEventListener("click", () => setViewMode("list"))
  }

  // Category "all" checkbox
  const categoryAllCheckbox = document.getElementById("category-all")
  if (categoryAllCheckbox) {
    categoryAllCheckbox.addEventListener("change", handleCategoryAllChange)
  }

  // Individual category checkboxes
  const categoryCheckboxes = document.querySelectorAll(".category-checkbox")
  categoryCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleCategoryChange)
  })

  // Search form
  const searchForm = document.querySelector("form.d-flex")
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchSubmit)
  }

  // Filters form
  const filtersForm = document.getElementById("filters-form")
  if (filtersForm) {
    filtersForm.addEventListener("submit", handleFiltersSubmit)
  }

  // Reset filters button
  const resetFiltersBtn = document.getElementById("reset-filters")
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", resetFilters)
  }

  // Report modal
  const reportModal = document.getElementById("reportModal")
  if (reportModal) {
    reportModal.addEventListener("show.bs.modal", handleReportModalShow)
  }

  // Submit report button
  const submitReportBtn = document.getElementById("submit-report")
  if (submitReportBtn) {
    submitReportBtn.addEventListener("click", handleReportSubmit)
  }

  // Contact modal
  const contactModal = document.getElementById("contactModal")
  if (contactModal) {
    contactModal.addEventListener("show.bs.modal", handleContactModalShow)
  }

  // Contact WhatsApp button
  const contactWhatsappBtn = document.getElementById("contact-whatsapp")
  if (contactWhatsappBtn) {
    contactWhatsappBtn.addEventListener("click", handleContactWhatsapp)
  }
}

/**
 * Handle filters form submission
 * @param {Event} event - Form submission event
 */
function handleFiltersSubmit(event) {
  event.preventDefault()
  applyFilters()
}

/**
 * Handle search form submission
 * @param {Event} event - Form submission event
 */
function handleSearchSubmit(event) {
  event.preventDefault()

  const searchInput = document.getElementById("search-input")
  if (!searchInput) return

  const searchTerm = searchInput.value.trim()

  // Update filters with search term
  currentFilters.search = searchTerm
  currentFilters.page = 1 // Reset to first page when searching

  // Load products with search
  loadProducts()

  // Update active filters display
  updateActiveFilters()
}

/**
 * Reset all filters
 */
function resetFilters() {
  // Restablecer checkboxes de categorías
  document.getElementById("category-all").checked = true
  document.querySelectorAll("#categories-container .category-checkbox").forEach((checkbox) => {
    checkbox.checked = false
  })

  // Restablecer checkboxes de condiciones
  document.querySelectorAll('input[id^="condition-"]').forEach((checkbox) => {
    checkbox.checked = false
  })

  // Restablecer ubicación
  const locationSelect = document.getElementById("campus-location")
  if (locationSelect) locationSelect.value = ""

  // Restablecer rango de precio
  const minPriceInput = document.getElementById("min-price")
  const maxPriceInput = document.getElementById("max-price")
  if (minPriceInput) minPriceInput.value = ""
  if (maxPriceInput) maxPriceInput.value = ""

  // Restablecer valoración
  const ratingAny = document.getElementById("rating-any")
  if (ratingAny) ratingAny.checked = true

  // Restablecer disponibilidad
  const inStockCheckbox = document.getElementById("in-stock-only")
  if (inStockCheckbox) inStockCheckbox.checked = false

  // Restablecer ordenamiento
  const sortBySelect = document.getElementById("sort-by")
  if (sortBySelect) sortBySelect.value = "newest"

  // Restablecer búsqueda
  const searchInput = document.getElementById("search-input")
  if (searchInput) searchInput.value = ""

  // Restablecer filtros actuales
  currentFilters = {
    categories: [],
    conditions: [],
    location: "",
    minPrice: "",
    maxPrice: "",
    rating: 0,
    inStock: false,
    sortBy: "newest",
    search: "",
    page: 1,
    pageSize: 12,
  }

  // Cargar productos con los filtros restablecidos
  loadProducts()

  // Ocultar filtros activos
  const activeFilters = document.getElementById("active-filters")
  if (activeFilters) activeFilters.classList.add("d-none")
}

/**
 * Update active filters display
 */
function updateActiveFilters() {
  const activeFiltersContainer = document.getElementById("active-filters-badges")
  if (!activeFiltersContainer) return

  activeFiltersContainer.innerHTML = ""

  let hasActiveFilters = false

  // Añadir categorías
  currentFilters.categories.forEach((category) => {
    const badge = createFilterBadge(getCategoryName(category), () => {
      const checkbox = document.getElementById(`category-${category}`)
      if (checkbox) checkbox.checked = false
      applyFilters()
    })
    activeFiltersContainer.appendChild(badge)
    hasActiveFilters = true
  })

  // Añadir condiciones
  currentFilters.conditions.forEach((condition) => {
    const badge = createFilterBadge(getConditionName(condition), () => {
      const checkbox = document.getElementById(`condition-${condition}`)
      if (checkbox) checkbox.checked = false
      applyFilters()
    })
    activeFiltersContainer.appendChild(badge)
    hasActiveFilters = true
  })

  // Añadir ubicación
  if (currentFilters.location) {
    const badge = createFilterBadge(`Ubicación: ${getLocationName(currentFilters.location)}`, () => {
      const locationSelect = document.getElementById("campus-location")
      if (locationSelect) locationSelect.value = ""
      applyFilters()
    })
    activeFiltersContainer.appendChild(badge)
    hasActiveFilters = true
  }

  // Añadir rango de precio
  if (currentFilters.minPrice || currentFilters.maxPrice) {
    let priceText = "Precio: "
    if (currentFilters.minPrice && currentFilters.maxPrice) {
      priceText += `$${currentFilters.minPrice} - $${currentFilters.maxPrice}`
    } else if (currentFilters.minPrice) {
      priceText += `desde $${currentFilters.minPrice}`
    } else {
      priceText += `hasta $${currentFilters.maxPrice}`
    }

    const badge = createFilterBadge(priceText, () => {
      const minPriceInput = document.getElementById("min-price")
      const maxPriceInput = document.getElementById("max-price")
      if (minPriceInput) minPriceInput.value = ""
      if (maxPriceInput) maxPriceInput.value = ""
      applyFilters()
    })
    activeFiltersContainer.appendChild(badge)
    hasActiveFilters = true
  }

  // Añadir valoración
  if (currentFilters.rating > 0) {
    const badge = createFilterBadge(`Valoración: ${currentFilters.rating}+ estrellas`, () => {
      const ratingAny = document.getElementById("rating-any")
      if (ratingAny) ratingAny.checked = true
      applyFilters()
    })
    activeFiltersContainer.appendChild(badge)
    hasActiveFilters = true
  }

  // Añadir disponibilidad
  if (currentFilters.inStock) {
    const badge = createFilterBadge("Solo disponibles", () => {
      const inStockCheckbox = document.getElementById("in-stock-only")
      if (inStockCheckbox) inStockCheckbox.checked = false
      applyFilters()
    })
    activeFiltersContainer.appendChild(badge)
    hasActiveFilters = true
  }

  // Añadir búsqueda
  if (currentFilters.search) {
    const badge = createFilterBadge(`Búsqueda: ${currentFilters.search}`, () => {
      const searchInput = document.getElementById("search-input")
      if (searchInput) searchInput.value = ""
      currentFilters.search = ""
      loadProducts()
      updateActiveFilters()
    })
    activeFiltersContainer.appendChild(badge)
    hasActiveFilters = true
  }

  // Mostrar u ocultar contenedor de filtros activos
  const activeFilters = document.getElementById("active-filters")
  if (activeFilters) {
    if (hasActiveFilters) {
      activeFilters.classList.remove("d-none")
    } else {
      activeFilters.classList.add("d-none")
    }
  }
}

/**
 * Crear badge de filtro activo
 * @param {string} text - Texto del badge
 * @param {Function} removeCallback - Función para eliminar el filtro
 * @returns {HTMLElement} Badge element
 */
function createFilterBadge(text, removeCallback) {
  const badge = document.createElement("span")
  badge.className = "badge bg-primary me-2 mb-2"
  badge.innerHTML = `${text} <button class="btn-close btn-close-white ms-1" style="font-size: 0.5rem;"></button>`

  badge.querySelector(".btn-close").addEventListener("click", removeCallback)

  return badge
}

/**
 * Handle category "all" checkbox change
 * @param {Event} event - Checkbox change event
 */
function handleCategoryAllChange(event) {
  const isChecked = event.target.checked
  const categoryCheckboxes = document.querySelectorAll("#categories-container .category-checkbox")

  // Enable/disable individual category checkboxes
  categoryCheckboxes.forEach((checkbox) => {
    checkbox.disabled = isChecked
    if (isChecked) {
      checkbox.checked = false
    }
  })

  // If "all" is checked, remove category filter
  if (isChecked) {
    currentFilters.categories = []
    loadProducts()
    updateActiveFilters()
  }
}

/**
 * Handle individual category checkbox change
 */
function handleCategoryChange() {
  const categoryCheckboxes = document.querySelectorAll("#categories-container .category-checkbox:checked")
  const categoryAllCheckbox = document.getElementById("category-all")

  // If any individual category is checked, uncheck "all"
  if (categoryCheckboxes.length > 0 && categoryAllCheckbox) {
    categoryAllCheckbox.checked = false
  }
}

/**
 * Set view mode (grid or list)
 * @param {string} mode - View mode ('grid' or 'list')
 */
function setViewMode(mode) {
  viewMode = mode

  // Actualizar botones
  const gridViewBtn = document.getElementById("grid-view-btn")
  const listViewBtn = document.getElementById("list-view-btn")

  if (gridViewBtn && listViewBtn) {
    if (mode === "grid") {
      gridViewBtn.classList.add("active")
      listViewBtn.classList.remove("active")
    } else {
      gridViewBtn.classList.remove("active")
      listViewBtn.classList.add("active")
    }
  }

  // Recargar productos
  loadProducts()
}

/**
 * Render products
 * @param {Array} products - Products to render
 */
function renderProducts(products, container) {
  container.innerHTML = ""

  // Set container class based on view mode
  container.className = viewMode === "grid" ? "row g-4" : "list-view"

  products.forEach((product) => {
    const isFavorite = favorites.includes(product.id)

    if (viewMode === "grid") {
      // Grid view
      const col = document.createElement("div")
      col.className = "col-md-6 col-lg-3"

      col.innerHTML = `
        <div class="card h-100 product-card">
          <div class="position-relative">
            <div class="bg-light" style="height: 200px; display: flex; align-items: center; justify-content: center;">
              <img src="${product.mainImageUrl}" class="img-fluid rounded-start h-100" alt="${product.title}" style="object-fit: cover;">
            </div>
            ${product.isSold ? '<div class="badge bg-danger position-absolute top-0 start-0 m-2">Vendido</div>' : ""}
            <button class="btn btn-sm position-absolute top-0 end-0 m-2 favorite-btn ${isFavorite ? "favorited" : ""}" data-product-id="${product.id}">
              <i class="fa${isFavorite ? "s" : "r"} fa-heart"></i>
            </button>
          </div>
          <div class="card-body">
            <h5 class="card-title">${product.title}</h5>
            <p class="card-text text-primary fw-bold">$${product.price.toFixed(2)}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="badge bg-secondary">${product.categoryName}</span>
              <small class="text-muted">${formatDate(new Date(product.createdAt))}</small>
            </div>
          </div>
          <div class="card-footer bg-white">
            <a href="product-details.html?id=${product.id}" class="btn btn-outline-primary w-100">Ver detalles</a>
          </div>
        </div>
      `

      container.appendChild(col)
    } else {
      // List view
      const row = document.createElement("div")
      row.className = "card mb-3 product-card"

      row.innerHTML = `
        <div class="row g-0">
          <div class="col-md-3 position-relative">
            <img src="${product.mainImageUrl}" class="img-fluid rounded-start h-100" alt="${product.title}" style="object-fit: cover;">
            <button class="btn btn-sm position-absolute top-0 end-0 m-2 favorite-btn ${isFavorite ? "btn-danger" : "btn-outline-danger"}" data-id="${product.id}">
              <i class="fas ${isFavorite ? "fa-heart" : "fa-heart"}"></i>
            </button>
          </div>
          <div class="col-md-9">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="card-title">${product.title}</h5>
                <p class="card-text text-primary fw-bold">$${product.price.toFixed(2)}</p>
              </div>
              <p class="card-text">${product.description.substring(0, 150)}${product.description.length > 150 ? "..." : ""}</p>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span class="badge bg-secondary me-2">${product.categoryName}</span>
                  <small class="text-muted">${formatDate(new Date(product.createdAt))}</small>
                </div>
                <div>
                  <a href="product-details.html?id=${product.id}" class="btn btn-outline-primary btn-sm me-2">Ver detalles</a>
                  <button class="btn btn-success btn-sm contact-btn" data-id="${product.id}" data-name="${product.title}">
                    <i class="fab fa-whatsapp"></i> Contactar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `

      container.appendChild(row)
    }
  })

  // Configurar eventos de botones
  setupFavoriteButtons()
  setupContactButtons()
}

/**
 * Update pagination
 * @param {number} totalPages - Total number of pages
 * @param {number} currentPage - Current page number
 */
function updatePagination(totalPages, currentPage) {
  const pagination = document.getElementById("pagination")
  if (!pagination) return

  // Clear pagination
  pagination.innerHTML = ""

  // If no pages, hide pagination
  if (totalPages <= 1) {
    pagination.style.display = "none"
    return
  }

  // Show pagination
  pagination.style.display = "flex"

  // Previous button
  const prevLi = document.createElement("li")
  prevLi.className = `page-item ${currentPage <= 1 ? "disabled" : ""}`

  const prevLink = document.createElement("a")
  prevLink.className = "page-link"
  prevLink.href = "#"
  prevLink.innerHTML = "&laquo;"
  prevLink.setAttribute("aria-label", "Previous")

  if (currentPage > 1) {
    prevLink.addEventListener("click", (e) => {
      e.preventDefault()
      goToPage(currentPage - 1)
    })
  }

  prevLi.appendChild(prevLink)
  pagination.appendChild(prevLi)

  // Page numbers
  const maxPages = 5 // Maximum number of page links to show
  let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
  const endPage = Math.min(totalPages, startPage + maxPages - 1)

  // Adjust start page if end page is at max
  if (endPage === totalPages) {
    startPage = Math.max(1, endPage - maxPages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement("li")
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`

    const pageLink = document.createElement("a")
    pageLink.className = "page-link"
    pageLink.href = "#"
    pageLink.textContent = i

    if (i !== currentPage) {
      pageLink.addEventListener("click", (e) => {
        e.preventDefault()
        goToPage(i)
      })
    }

    pageLi.appendChild(pageLink)
    pagination.appendChild(pageLi)
  }

  // Next button
  const nextLi = document.createElement("li")
  nextLi.className = `page-item ${currentPage >= totalPages ? "disabled" : ""}`

  const nextLink = document.createElement("a")
  nextLink.className = "page-link"
  nextLink.href = "#"
  nextLink.innerHTML = "&raquo;"
  nextLink.setAttribute("aria-label", "Next")

  if (currentPage < totalPages) {
    nextLink.addEventListener("click", (e) => {
      e.preventDefault()
      goToPage(currentPage + 1)
    })
  }

  nextLi.appendChild(nextLink)
  pagination.appendChild(nextLi)
}

/**
 * Go to specific page
 * @param {number} page - Page number
 */
function goToPage(page) {
  // Update current page
  currentFilters.page = page

  // Load products for page
  loadProducts()

  // Scroll to top of products
  const productsContainer = document.getElementById("products-container")
  if (productsContainer) {
    productsContainer.scrollIntoView({ behavior: "smooth" })
  }
}

/**
 * Set up favorite buttons
 */
function setupFavoriteButtons() {
  const favoriteButtons = document.querySelectorAll(".favorite-btn");
  console.log("Configurando botones de favoritos...");

  favoriteButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Verificar autenticación
      if (!tokenService.isAuthenticated()) {
        console.log("Usuario no autenticado");
        showToast("Debes iniciar sesión para agregar favoritos", "error");
        window.location.href = 'sign-in.html';
        return;
      }

      // Obtener ID del producto
      const productId = button.dataset.productId;
      if (!productId) {
        console.error("No se encontró el ID del producto");
        showToast("Error: No se pudo identificar el producto", "error");
        return;
      }

      // Verificar estado actual
      const isFavorite = button.classList.contains("favorited");
      console.log(`Estado actual del producto ${productId}: ${isFavorite ? "favorito" : "no favorito"}`);

      try {
        // Deshabilitar botón durante la operación
        button.disabled = true;
        button.style.opacity = "0.5";
        
        if (isFavorite) {
          console.log(`Intentando eliminar favorito ${productId}...`);
          await apiService.removeFavorite(productId);
          
          button.classList.remove("favorited");
          button.innerHTML = '<i class="far fa-heart"></i>';
          showToast("Producto eliminado de favoritos");
          
          // Actualizar array local
          const index = favorites.indexOf(productId);
          if (index > -1) {
            favorites.splice(index, 1);
          }
        } else {
          console.log(`Intentando agregar favorito ${productId}...`);
          await apiService.addFavorite(productId);
          
          button.classList.add("favorited");
          button.innerHTML = '<i class="fas fa-heart"></i>';
          showToast("Producto añadido a favoritos");
          
          // Actualizar array local
          if (!favorites.includes(productId)) {
            favorites.push(productId);
          }
        }

        console.log("Operación completada exitosamente");
      } catch (error) {
        console.error("Error al actualizar favorito:", error);
        
        // Mostrar mensaje de error específico
        if (error.message.includes("No autorizado")) {
          showToast("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.", "error");
          window.location.href = 'sign-in.html';
        } else {
          showToast(error.message || "Error al actualizar favorito", "error");
        }
        
        // Revertir cambios visuales
        if (isFavorite) {
          button.classList.add("favorited");
          button.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
          button.classList.remove("favorited");
          button.innerHTML = '<i class="far fa-heart"></i>';
        }
      } finally {
        // Restaurar estado del botón
        button.disabled = false;
        button.style.opacity = "1";
      }
    });
  });
}

/**
 * Set up contact buttons
 */
function setupContactButtons() {
  const contactButtons = document.querySelectorAll(".contact-btn")

  contactButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!tokenService.isAuthenticated()) {
        showToast("Debes iniciar sesión para contactar al vendedor", "error")
        return
      }

      const productId = button.dataset.id
      const productName = button.dataset.name

      // Configurar modal
      document.getElementById("contact-product-name").textContent = productName
      document.getElementById("contact-whatsapp").dataset.id = productId

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById("contactModal"))
      modal.show()
    })
  })
}

/**
 * Handle report modal show
 * @param {Event} event - Modal show event
 */
function handleReportModalShow(event) {
  const button = event.relatedTarget
  const productId = button ? button.closest(".product-card").dataset.id : null

  if (productId) {
    document.getElementById("report-product-id").value = productId
  }
}

/**
 * Handle report form submission
 */
async function handleReportSubmit() {
  const productId = document.getElementById("report-product-id").value
  const reason = document.getElementById("report-reason").value
  const description = document.getElementById("report-description").value

  if (!productId) {
    showToast("Error: No se pudo identificar el producto", "error")
    return
  }

  if (!reason) {
    showToast("Por favor, selecciona un motivo", "error")
    return
  }

  if (!description) {
    showToast("Por favor, proporciona una descripción", "error")
    return
  }

  try {
    // Show loading state
    const submitButton = document.getElementById("submit-report")
    if (submitButton) {
      submitButton.disabled = true
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...'
    }

    // Submit report
    await apiService.createReport({
      reportedProductId: productId,
      subject: reason,
      description: description,
    })

    // Show success message
    showToast("Reporte enviado exitosamente", "success")

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("reportModal"))
    if (modal) {
      modal.hide()
    }

    // Reset form
    document.getElementById("report-reason").value = ""
    document.getElementById("report-description").value = ""

    // Reset button state
    if (submitButton) {
      submitButton.disabled = false
      submitButton.textContent = "Enviar reporte"
    }
  } catch (error) {
    console.error("Error submitting report:", error)

    let errorMessage = "Error al enviar el reporte"

    if (error.data && error.data.message) {
      errorMessage = error.data.message
    }

    showToast(errorMessage, "error")

    // Reset button state
    const submitButton = document.getElementById("submit-report")
    if (submitButton) {
      submitButton.disabled = false
      submitButton.textContent = "Enviar reporte"
    }
  }
}

/**
 * Handle contact modal show
 * @param {Event} event - Modal show event
 */
async function handleContactModalShow(event) {
  const button = event.relatedTarget
  const productId = button ? button.dataset.id : null

  if (!productId) return

  try {
    // Get product details
    const product = await apiService.getProduct(productId)

    // Update modal content
    document.getElementById("contact-product-name").textContent = product.title

    // Store product data
    document.getElementById("contact-whatsapp").value = product.contactWhatsapp
    document.getElementById("contact-product-id").value = productId
  } catch (error) {
    console.error("Error loading product details:", error)
    showToast("Error al cargar detalles del producto", "error")
  }
}

/**
 * Handle contact WhatsApp button click
 */
function handleContactWhatsapp() {
  const whatsappNumber = document.getElementById("contact-whatsapp").value
  const productName = document.getElementById("contact-product-name").textContent
  const customMessage = document.getElementById("contact-message").value

  if (!whatsappNumber) {
    showToast("Error: No se pudo obtener el número de contacto", "error")
    return
  }

  // Create message
  let message = customMessage.trim()
  if (!message) {
    message = `Hola, estoy interesado en tu producto "${productName}" que vi en UTTianguis. ¿Está disponible?`
  }

  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/52${whatsappNumber}?text=${encodeURIComponent(message)}`

  // Open WhatsApp
  window.open(whatsappUrl, "_blank")

  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById("contactModal"))
  if (modal) {
    modal.hide()
  }
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Hoy"
  } else if (diffDays === 1) {
    return "Ayer"
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`
  } else {
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
}

// Funciones auxiliares
function getCategoryName(categoryId) {
  // Aquí debes tener la lógica para obtener el nombre de la categoría
  // Puedes usar un objeto o un array para mapear los IDs a los nombres
  const categories = {
    1: "Electrónicos",
    2: "Libros",
    3: "Ropa",
    4: "Muebles",
    5: "Otros",
  }
  return categories[categoryId] || "Desconocido"
}

function getConditionName(condition) {
  const conditions = {
    new: "Nuevo",
    like_new: "Como Nuevo",
    good: "Buen Estado",
    used: "Usado",
    repair: "Para Reparar",
  }
  return conditions[condition] || "Desconocido"
}

function getConditionClass(condition) {
  const conditionClasses = {
    new: "bg-success",
    like_new: "bg-info",
    good: "bg-primary",
    used: "bg-warning",
    repair: "bg-danger",
  }
  return conditionClasses[condition] || "bg-secondary"
}

function getLocationName(location) {
  const locations = {
    "edificio-a": "Edificio A",
    "edificio-b": "Edificio B",
    "edificio-c": "Edificio C",
    cit: "CIT",
    cafeteria: "Cafetería",
    entrada: "Entrada",
    canchas: "Canchas",
  }
  return locations[location] || "Desconocido"
}

// Inicializar la página al cargar el DOM
document.addEventListener("DOMContentLoaded", initMarketplacePage)

