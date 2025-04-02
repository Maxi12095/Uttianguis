console.log("sell-product.js cargado");

import apiService from "./api/apiService.js";
import authService from "./api/authService.js";
import { showToast } from "./auth.js";
import { validateSellAccess } from "./validation.js";
import { fileToBase64 } from "./imageToBase64.js";


// Global variables
let selectedImages = [];
let categories = [];

/**
 * Handle product form submission
 * @param {Event} event - Form submission event
 */
async function handleProductSubmit(event) {
  event.preventDefault();
  console.log("=== INICIO DE HANDLE PRODUCT SUBMIT ===");

  // Get form inputs
  const titleInput = document.getElementById("product-title");
  const descriptionInput = document.getElementById("product-description");
  const priceInput = document.getElementById("product-price");
  const categorySelect = document.getElementById("product-category");
  const conditionSelect = document.getElementById("product-condition");
  const stockInput = document.getElementById("product-stock");
  const meetingPointInput = document.getElementById(
    "product-meeting-point"
  ) || { value: "" };
  const contactWhatsappInput = document.getElementById("product-whatsapp") || {
    value: "",
  };
  const imagesInput = document.getElementById("product-images");

  // Verificar autenticación
  if (!authService.isAuthenticated()) {
    showToast("Debes iniciar sesión para publicar productos", "error");
    window.location.href = "sign-in.html?redirect=sell-product.html";
    return;
  }

  // Show loading state
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Publicando producto...';
  }

  try {
    // Convertir imágenes a Base64
    // Verifica que haya al menos un archivo seleccionado
    if (!imagesInput || !imagesInput.files || imagesInput.files.length === 0) {
      console.error("No se seleccionaron imágenes.");
      showToast("Debes seleccionar al menos una imagen", "error");
      return;
    }

    // Obtener el primer archivo seleccionado
    const imageFile = imagesInput.files[0];

    // Verificar si el archivo es válido
    if (!(imageFile instanceof Blob)) {
      console.error("El archivo seleccionado no es válido.");
      showToast("El archivo seleccionado no es válido", "error");
      return;
    }
    const imageBase64 = await fileToBase64(imageFile);

    // Crear objeto del producto
    const productData = {
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      price: Number.parseFloat(priceInput.value),
      mainImageUrl: imageBase64, // Ahora la imágene está en Base64
      categoryId: Number.parseInt(categorySelect.value),
      condition: conditionSelect.value,
      //stock: Number.parseInt(stockInput.value),
      meetingPoint: meetingPointInput.value.trim(),
      contactWhatsapp: contactWhatsappInput.value.trim()
    };

    console.log("Datos del producto a enviar:", productData);
    console.log("Token de autenticación:", authService.getToken());

    // Enviar producto a la API
    console.log("Iniciando llamada a API...");
    const response = await apiService.createProduct(productData);
    console.log("Respuesta de la API:", response);

    if (response && response.id) {
      console.log("Producto creado exitosamente con ID:", response.id);
      showToast("Producto publicado exitosamente", "success");

      setTimeout(() => {
        window.location.href = `product-details.html?id=${response.id}`;
      }, 1500);
    } else {
      throw new Error("No se pudo crear el producto");
    }
  } catch (error) {
    console.error("Error completo al crear el producto:", error);
    showToast(error.message || "Error al publicar el producto", "error");

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML =
        '<i class="fas fa-upload me-2"></i>Publicar Producto';
    }
  } finally {
    console.log("=== FIN DE HANDLE PRODUCT SUBMIT ===");
  }
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
  if (!authService.isAuthenticated()) {
    window.location.href = "sign-in.html?redirect=sell-product.html";
    return false;
  }
  return true;
}

/**
 * Initialize sell product page
 */
export async function initSellProductPage() {
  console.log("Iniciando página de venta de productos...");

  try {
    // Load categories first
    console.log("Cargando categorías...");
    await loadCategories();

    // Set up event listeners
    console.log("Configurando event listeners...");
    setupEventListeners();

    // Pre-fill user data last
    console.log("Cargando datos del usuario...");
    await prefillUserData();

    console.log("Inicialización completada");
  } catch (error) {
    console.error("Error durante la inicialización:", error);
    showToast(
      "Error al cargar la página. Por favor, intenta de nuevo.",
      "error"
    );
  }
}

/**
 * Load categories from API
 */
async function loadCategories() {
  try {
    categories = await apiService.getCategories();

    // Populate category dropdown
    const categorySelect = document.getElementById("product-category");

    if (categorySelect && categories.length > 0) {
      // Clear existing options except the first one
      while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
      }

      // Add categories
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    showToast("Error al cargar las categorías", "error");
  }
}

/**
 * Pre-fill user data from profile
 */
async function prefillUserData() {
  try {
    const profile = await apiService.getCurrentUserProfile();

    // Pre-fill phone number
    const phoneInput = document.getElementById("product-whatsapp");
    if (phoneInput && profile.phoneNumber) {
      phoneInput.value = profile.phoneNumber;
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
    // Don't show error toast for this, it's not critical
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  console.log("=== INICIO DE SETUP EVENT LISTENERS ===");

  // Product form
  const productForm = document.getElementById("sellProductForm");
  console.log("Formulario encontrado:", productForm);

  if (productForm) {
    console.log("Agregando event listener al formulario...");

    // Remover cualquier event listener existente
    productForm.removeEventListener("submit", handleProductSubmit);

    // Agregar el nuevo event listener
    productForm.addEventListener("submit", (event) => {
      console.log("Evento submit detectado en el formulario");
      handleProductSubmit(event);
    });

    console.log("Event listener agregado correctamente");

    // Verificar el botón de submit
    const submitButton = productForm.querySelector('button[type="submit"]');
    if (submitButton) {
      console.log("Botón de submit encontrado:", submitButton);
      submitButton.addEventListener("click", (event) => {
        console.log("Click en el botón de submit detectado");
      });
    } else {
      console.error("No se encontró el botón de submit en el formulario");
    }
  } else {
    console.error("No se encontró el formulario con ID 'sellProductForm'");
  }

  // Image preview
  const imagesInput = document.getElementById("product-images");
  const imagePreview = document.getElementById("imagePreview");

  if (imagesInput && imagePreview) {
    console.log("Configurando preview de imágenes...");
    imagesInput.addEventListener("change", (event) => {
      console.log("Cambio en input de imágenes detectado");
      const files = event.target.files;
      if (files.length > 0) {
        console.log(`${files.length} imágenes seleccionadas`);
        // Clear previous preview
        imagePreview.innerHTML = "";

        // Show preview for each image
        Array.from(files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "img-thumbnail";
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.objectFit = "cover";
            img.style.margin = "5px";
            imagePreview.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      }
    });
  } else {
    console.error("No se encontraron los elementos para preview de imágenes");
  }

  console.log("=== FIN DE SETUP EVENT LISTENERS ===");
}

/**
 * Upload product images
 * @param {number} productId - Product ID
 */
async function uploadProductImages(productId) {
  try {
    for (const image of selectedImages) {
      await apiService.uploadProductImage(productId, image);
    }
  } catch (error) {
    console.error("Error uploading images:", error);
    throw new Error("Error al subir las imágenes del producto");
  }
}

// Initialize the page when the script loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Iniciando inicialización de la página...");
  initSellProductPage().catch((error) => {
    console.error("Error durante la inicialización:", error);
    showToast("Error al cargar la página", "error");
  });
});
