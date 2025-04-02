using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTTianguisAPI.Services;

namespace UTTianguisAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FavoritesController : ControllerBase
    {
        private readonly IFavoriteService _favoriteService;

        public FavoritesController(IFavoriteService favoriteService)
        {
            _favoriteService = favoriteService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserFavorites()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var favorites = await _favoriteService.GetUserFavoritesAsync(userId);

            return Ok(favorites);
        }

        [HttpPost("{productId}")]
        public async Task<IActionResult> AddFavorite(int productId)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _favoriteService.AddFavoriteAsync(userId, productId);

            if (!result)
            {
                return BadRequest(new { message = "No se pudo agregar el producto a favoritos" });
            }

            return Ok(new { message = "Producto agregado a favoritos" });
        }

        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFavorite(int productId)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _favoriteService.RemoveFavoriteAsync(userId, productId);

            if (!result)
            {
                return BadRequest(new { message = "No se pudo eliminar el producto de favoritos" });
            }

            return Ok(new { message = "Producto eliminado de favoritos" });
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> IsFavorite(int productId)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var isFavorite = await _favoriteService.IsFavoriteAsync(userId, productId);

            return Ok(new { isFavorite });
        }
    }
}




