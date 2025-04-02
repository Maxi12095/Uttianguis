using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Services;

namespace UTTianguisAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly IUserService _userService;

        public AdminController(IAdminService adminService, IUserService userService)
        {
            _adminService = adminService;
            _userService = userService;
        }

        [HttpGet("statistics/dashboard")]
        public async Task<ActionResult<AdminStatisticsDTO>> GetDashboardStatistics()
        {
            var statistics = await _adminService.GetDashboardStatisticsAsync();
            return Ok(statistics);
        }

        [HttpGet("statistics/reports")]
        public async Task<ActionResult<ReportStatisticsDTO>> GetReportStatistics()
        {
            var statistics = await _adminService.GetReportStatisticsAsync();
            return Ok(statistics);
        }

        [HttpPut("reports/{id}/resolve")]
        public async Task<IActionResult> ResolveReport(int id, [FromBody] string resolution)
        {
            var adminId = _userService.GetUserIdFromClaims(User);
            var result = await _adminService.ResolveReportAsync(id, resolution, adminId);

            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPut("reports/{id}/dismiss")]
        public async Task<IActionResult> DismissReport(int id, [FromBody] string reason)
        {
            var adminId = _userService.GetUserIdFromClaims(User);
            var result = await _adminService.DismissReportAsync(id, reason, adminId);

            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPut("users/{id}/suspend")]
        public async Task<IActionResult> SuspendUser(int id, [FromBody] string reason)
        {
            var adminId = _userService.GetUserIdFromClaims(User);
            var result = await _adminService.SuspendUserAsync(id, reason, adminId);

            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPut("users/{id}/activate")]
        public async Task<IActionResult> ActivateUser(int id)
        {
            var adminId = _userService.GetUserIdFromClaims(User);
            var result = await _adminService.ActivateUserAsync(id, adminId);

            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPut("products/{id}/remove")]
        public async Task<IActionResult> RemoveProduct(int id, [FromBody] string reason)
        {
            var adminId = _userService.GetUserIdFromClaims(User);
            var result = await _adminService.RemoveProductAsync(id, reason, adminId);

            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}


