using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Services;

namespace UTTianguisAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IFileService _fileService;

        public ProductsController(IProductService productService, IFileService fileService)
        {
            _productService = productService;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] string category = null,
            [FromQuery] string search = null,
            [FromQuery] string condition = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null)
        {
            int? currentUserId = null;
            if (User.Identity.IsAuthenticated)
            {
                currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            }

            var products = await _productService.GetProductsAsync(category, search, condition, minPrice, maxPrice, currentUserId);
            return Ok(products);
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts()
        {
            int? currentUserId = null;
            if (User.Identity.IsAuthenticated)
            {
                currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            }

            var products = await _productService.GetFeaturedProductsAsync(currentUserId);
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            int? currentUserId = null;
            if (User.Identity.IsAuthenticated)
            {
                currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            }

            var product = await _productService.GetProductByIdAsync(id, currentUserId);
            if (product == null)
            {
                return NotFound(new { message = "Producto no encontrado" });
            }

            return Ok(product);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDTO createProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var productId = await _productService.CreateProductAsync(userId, createProductDto);

            return CreatedAtAction(nameof(GetProduct), new { id = productId }, new { id = productId });
        }

        [Authorize]
        [HttpPost("{id}/images")]
        public async Task<IActionResult> AddProductImage(int id, IFormFile image, [FromQuery] bool isMainImage = false)
        {
            if (image == null)
            {
                return BadRequest(new { message = "No se ha proporcionado ninguna imagen" });
            }

            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var product = await _productService.GetProductByIdAsync(id, userId);

            if (product == null)
            {
                return NotFound(new { message = "Producto no encontrado" });
            }

            if (product.SellerId != userId && User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value != "Admin")
            {
                return Forbid();
            }

            var imageUrl = await _fileService.SaveImageAsync(image, "images/products");

            if (string.IsNullOrEmpty(imageUrl))
            {
                return BadRequest(new { message = "Error al guardar la imagen" });
            }

            var result = await _productService.AddProductImageAsync(id, imageUrl, isMainImage);

            if (!result)
            {
                return BadRequest(new { message = "Error al agregar la imagen al producto" });
            }

            return Ok(new { imageUrl });
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDTO updateProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _productService.UpdateProductAsync(id, userId, updateProductDto);

            if (!result)
            {
                return NotFound(new { message = "Producto no encontrado o no tienes permiso para editarlo" });
            }

            return Ok(new { message = "Producto actualizado exitosamente" });
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _productService.DeleteProductAsync(id, userId);

            if (!result)
            {
                return NotFound(new { message = "Producto no encontrado o no tienes permiso para eliminarlo" });
            }

            return Ok(new { message = "Producto eliminado exitosamente" });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingProducts()
        {
            var products = await _productService.GetPendingApprovalProductsAsync();
            return Ok(products);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveProduct(int id)
        {
            var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _productService.ApproveProductAsync(id, adminId);

            if (!result)
            {
                return NotFound(new { message = "Producto no encontrado o no tienes permiso para aprobarlo" });
            }

            return Ok(new { message = "Producto aprobado exitosamente" });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectProduct(int id, [FromBody] string reason)
        {
            var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _productService.RejectProductAsync(id, adminId, reason);

            if (!result)
            {
                return NotFound(new { message = "Producto no encontrado o no tienes permiso para rechazarlo" });
            }

            return Ok(new { message = "Producto rechazado exitosamente" });
        }
    }
}


