using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Services;

namespace UTTianguisAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly IFileService _fileService;

        public ReportsController(IReportService reportService, IFileService fileService)
        {
            _reportService = reportService;
            _fileService = fileService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromForm] CreateReportDTO createReportDto, IFormFile screenshot)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (screenshot == null)
            {
                return BadRequest(new { message = "La captura de pantalla es obligatoria" });
            }

            var reporterId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);

            // Save screenshot
            var screenshotUrl = await _fileService.SaveImageAsync(screenshot, "images/reports");

            if (string.IsNullOrEmpty(screenshotUrl))
            {
                return BadRequest(new { message = "Error al guardar la captura de pantalla" });
            }

            var result = await _reportService.CreateReportAsync(reporterId, createReportDto, screenshotUrl);

            if (!result)
            {
                return BadRequest(new { message = "No se pudo crear el reporte" });
            }

            return Ok(new { message = "Reporte creado exitosamente" });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllReports([FromQuery] string status = null)
        {
            var reports = await _reportService.GetAllReportsAsync(status);
            return Ok(reports);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReport(int id)
        {
            var report = await _reportService.GetReportByIdAsync(id);

            if (report == null)
            {
                return NotFound(new { message = "Reporte no encontrado" });
            }

            return Ok(report);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/resolve")]
        public async Task<IActionResult> ResolveReport(int id, [FromBody] ResolveReportDTO resolveReportDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            var result = await _reportService.ResolveReportAsync(id, adminId, resolveReportDto);

            if (!result)
            {
                return NotFound(new { message = "Reporte no encontrado o no tienes permiso para resolverlo" });
            }

            return Ok(new { message = "Reporte resuelto exitosamente" });
        }
    }
}

