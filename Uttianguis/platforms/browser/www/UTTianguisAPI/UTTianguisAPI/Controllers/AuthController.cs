using Microsoft.AspNetCore.Mvc;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Services;

namespace UTTianguisAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IApiKeyService _apiKeyService;

        public AuthController(IUserService userService, IApiKeyService apiKeyService)
        {
            _userService = userService;
            _apiKeyService = apiKeyService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _userService.RegisterUserAsync(registerDto);
            if (!result)
            {
                return BadRequest(new { message = "El correo electrónico ya está registrado" });
            }

            return Ok(new { message = "Usuario registrado exitosamente" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.AuthenticateAsync(loginDto.Email, loginDto.Password);
            if (user == null)
            {
                return Unauthorized(new { message = "Correo electrónico o contraseña incorrectos" });
            }

            var apiKey = await _apiKeyService.GenerateApiKeyAsync(user.Id);

            return Ok(new AuthResponseDTO
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                Token = apiKey.Key,
                ProfileImageUrl = user.ProfileImage
            });
        }
    }
}

