using Microsoft.EntityFrameworkCore;
using UTTianguisAPI.Data;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public class ReportService : IReportService
    {
        private readonly ApplicationDbContext _context;

        public ReportService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateReportAsync(int reporterId, CreateReportDTO createReportDto, string screenshotUrl)
        {
            // Validate that either a user or a product is being reported
            if (!createReportDto.ReportedUserId.HasValue && !createReportDto.ReportedProductId.HasValue)
            {
                return false;
            }

            // Check if reporter exists
            var reporter = await _context.Users.FindAsync(reporterId);
            if (reporter == null)
            {
                return false;
            }

            // If reporting a user, check if user exists
            if (createReportDto.ReportedUserId.HasValue)
            {
                var reportedUser = await _context.Users.FindAsync(createReportDto.ReportedUserId.Value);
                if (reportedUser == null)
                {
                    return false;
                }
            }

            // If reporting a product, check if product exists
            if (createReportDto.ReportedProductId.HasValue)
            {
                var reportedProduct = await _context.Products.FindAsync(createReportDto.ReportedProductId.Value);
                if (reportedProduct == null)
                {
                    return false;
                }
            }

            // Create report
            var report = new Report
            {
                ReporterId = reporterId,
                ReportedUserId = createReportDto.ReportedUserId,
                ReportedProductId = createReportDto.ReportedProductId,
                Subject = createReportDto.Subject,
                Description = createReportDto.Description,
                ScreenshotUrl = screenshotUrl,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ReportDTO> GetReportByIdAsync(int reportId)
        {
            var report = await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReportedUser)
                .Include(r => r.ReportedProduct)
                .FirstOrDefaultAsync(r => r.Id == reportId);

            if (report == null)
            {
                return null;
            }

            return new ReportDTO
            {
                Id = report.Id,
                ReporterId = report.ReporterId,
                ReporterName = report.Reporter.Name,
                ReportedUserId = report.ReportedUserId,
                ReportedUserName = report.ReportedUser?.Name,
                ReportedProductId = report.ReportedProductId,
                ReportedProductTitle = report.ReportedProduct?.Title,
                Subject = report.Subject,
                Description = report.Description,
                ScreenshotUrl = report.ScreenshotUrl,
                Status = report.Status,
                AdminResponse = report.AdminResponse,
                CreatedAt = report.CreatedAt,
                ResolvedAt = report.ResolvedAt
            };
        }

        public async Task<IEnumerable<ReportDTO>> GetAllReportsAsync(string status = null)
        {
            var query = _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReportedUser)
                .Include(r => r.ReportedProduct)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var reports = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReportDTO
                {
                    Id = r.Id,
                    ReporterId = r.ReporterId,
                    ReporterName = r.Reporter.Name,
                    ReportedUserId = r.ReportedUserId,
                    ReportedUserName = r.ReportedUser != null ? r.ReportedUser.Name : null,
                    ReportedProductId = r.ReportedProductId,
                    ReportedProductTitle = r.ReportedProduct != null ? r.ReportedProduct.Title : null,
                    Subject = r.Subject,
                    Description = r.Description,
                    ScreenshotUrl = r.ScreenshotUrl,
                    Status = r.Status,
                    AdminResponse = r.AdminResponse,
                    CreatedAt = r.CreatedAt,
                    ResolvedAt = r.ResolvedAt
                })
                .ToListAsync();

            return reports;
        }

        public async Task<bool> ResolveReportAsync(int reportId, int adminId, ResolveReportDTO resolveReportDto)
        {
            // Check if admin
            var admin = await _context.Users.FindAsync(adminId);
            if (admin == null || admin.Role != "Admin")
            {
                return false;
            }

            var report = await _context.Reports.FindAsync(reportId);
            if (report == null)
            {
                return false;
            }

            report.Status = resolveReportDto.Status;
            report.AdminResponse = resolveReportDto.AdminResponse;
            report.ResolvedAt = DateTime.UtcNow;

            _context.Reports.Update(report);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}


