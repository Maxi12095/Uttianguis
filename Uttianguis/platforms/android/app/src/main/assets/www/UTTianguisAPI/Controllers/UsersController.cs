using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Services;

namespace UTTianguisAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IFileService _fileService;

        public UsersController(IUserService userService, IFileService fileService)
        {
            _userService = userService;
            _fileService = fileService;
        }

        [HttpGet("profile/{id}")]
        public async Task<IActionResult> GetProfile(int id)
        {
            var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var profile = await _userService.GetUserProfileAsync(id, currentUserId);

            if (profile == null)
            {
                return NotFound(new { message = "Usuario no encontrado" });
            }

            return Ok(profile);
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var profile = await _userService.GetUserProfileAsync(userId, userId);

            if (profile == null)
            {
                return NotFound(new { message = "Usuario no encontrado" });
            }

            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDTO updateProfileDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _userService.UpdateProfileAsync(userId, updateProfileDto);

            if (!result)
            {
                return NotFound(new { message = "Usuario no encontrado" });
            }

            return Ok(new { message = "Perfil actualizado exitosamente" });
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO changePasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _userService.ChangePasswordAsync(userId, changePasswordDto);

            if (!result)
            {
                return BadRequest(new { message = "La contraseña actual es incorrecta" });
            }

            return Ok(new { message = "Contraseña actualizada exitosamente" });
        }

        [HttpPost("profile-image")]
        public async Task<IActionResult> UploadProfileImage(IFormFile image)
        {
            if (image == null)
            {
                return BadRequest(new { message = "No se ha proporcionado ninguna imagen" });
            }

            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var imageUrl = await _fileService.SaveImageAsync(image, "images/profiles");

            if (string.IsNullOrEmpty(imageUrl))
            {
                return BadRequest(new { message = "Error al guardar la imagen" });
            }

            var result = await _userService.UpdateProfileImageAsync(userId, imageUrl);

            if (!result)
            {
                return NotFound(new { message = "Usuario no encontrado" });
            }

            return Ok(new { imageUrl });
        }

        [HttpGet("{id}/products")]
        public async Task<IActionResult> GetUserProducts(int id)
        {
            var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var products = await _userService.GetUserProductsAsync(id, currentUserId);

            return Ok(products);
        }
    }
}

