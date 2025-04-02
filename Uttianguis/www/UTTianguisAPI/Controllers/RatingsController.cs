using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Services;

namespace UTTianguisAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RatingsController : ControllerBase
    {
        private readonly IRatingService _ratingService;

        public RatingsController(IRatingService ratingService)
        {
            _ratingService = ratingService;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserRatings(int userId)
        {
            var ratings = await _ratingService.GetUserRatingsAsync(userId);
            return Ok(ratings);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> RateUser([FromBody] CreateRatingDTO createRatingDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var raterId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);

            // Check if user is trying to rate themselves
            if (raterId == createRatingDto.UserId)
            {
                return BadRequest(new { message = "No puedes valorarte a ti mismo" });
            }

            var result = await _ratingService.RateUserAsync(raterId, createRatingDto);

            if (!result)
            {
                return BadRequest(new { message = "No se pudo valorar al usuario" });
            }

            return Ok(new { message = "Usuario valorado exitosamente" });
        }
    }
}

