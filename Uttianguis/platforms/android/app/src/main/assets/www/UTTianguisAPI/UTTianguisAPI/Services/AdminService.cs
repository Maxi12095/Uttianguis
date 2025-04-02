using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UTTianguisAPI.Data;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public AdminService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<AdminStatisticsDTO> GetDashboardStatisticsAsync()
        {
            // Obtener estadísticas generales
            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.Where(u => u.IsActive).CountAsync();
            var totalProducts = await _context.Products.CountAsync();
            var activeProducts = await _context.Products.Where(p => p.IsActive && !p.IsSold).CountAsync();
            var soldProducts = await _context.Products.Where(p => p.IsSold).CountAsync();
            var pendingReports = await _context.Reports.Where(r => r.Status == "Pending").CountAsync();
            var resolvedReports = await _context.Reports.Where(r => r.Status == "Resolved").CountAsync();

            // Productos por categoría
            var productsByCategory = await _context.Products
                .GroupBy(p => p.Category.Name)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Category, x => x.Count);

            // Reportes por tipo
            var reportsByType = await _context.Reports
                .GroupBy(r => r.Subject)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Type, x => x.Count);

            // Estadísticas mensuales (últimos 6 meses)
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
            var monthlyStats = await _context.Users
                .Where(u => u.CreatedAt >= sixMonthsAgo)
                .GroupBy(u => new { Month = u.CreatedAt.Month, Year = u.CreatedAt.Year })
                .Select(g => new {
                    Month = g.Key.Year + "-" + g.Key.Month,
                    NewUsers = g.Count()
                })
                .ToListAsync();

            var productMonthlyStats = await _context.Products
                .Where(p => p.CreatedAt >= sixMonthsAgo)
                .GroupBy(p => new { Month = p.CreatedAt.Month, Year = p.CreatedAt.Year })
                .Select(g => new {
                    Month = g.Key.Year + "-" + g.Key.Month,
                    NewProducts = g.Count(),
                    SoldProducts = g.Count(p => p.IsSold)
                })
                .ToListAsync();

            // Combinar estadísticas mensuales
            var combinedMonthlyStats = new List<MonthlyStatDTO>();
            foreach (var month in monthlyStats.Select(m => m.Month).Union(productMonthlyStats.Select(m => m.Month)).Distinct())
            {
                var userStat = monthlyStats.FirstOrDefault(m => m.Month == month);
                var productStat = productMonthlyStats.FirstOrDefault(m => m.Month == month);

                combinedMonthlyStats.Add(new MonthlyStatDTO
                {
                    Month = month,
                    NewUsers = userStat?.NewUsers ?? 0,
                    NewProducts = productStat?.NewProducts ?? 0,
                    SoldProducts = productStat?.SoldProducts ?? 0
                });
            }

            return new AdminStatisticsDTO
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                TotalProducts = totalProducts,
                ActiveProducts = activeProducts,
                SoldProducts = soldProducts,
                PendingReports = pendingReports,
                ResolvedReports = resolvedReports,
                ProductsByCategory = productsByCategory,
                ReportsByType = reportsByType,
                MonthlyStats = combinedMonthlyStats.OrderBy(m => m.Month).ToList()
            };
        }

        public async Task<ReportStatisticsDTO> GetReportStatisticsAsync()
        {
            var totalReports = await _context.Reports.CountAsync();
            var pendingReports = await _context.Reports.Where(r => r.Status == "Pending").CountAsync();
            var resolvedReports = await _context.Reports.Where(r => r.Status == "Resolved").CountAsync();
            var dismissedReports = await _context.Reports.Where(r => r.Status == "Rejected").CountAsync();

            var reportsByReason = await _context.Reports
                .GroupBy(r => r.Description)
                .Select(g => new { Reason = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Reason, x => x.Count);

            var recentReports = await _context.Reports
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new RecentReportDTO
                {
                    Id = r.Id,
                    ReporterName = r.Reporter.Name,
                    ReportedItemType = r.Subject,
                    Reason = r.Description,
                    CreatedAt = r.CreatedAt,
                    Status = r.Status
                })
                .ToListAsync();

            return new ReportStatisticsDTO
            {
                TotalReports = totalReports,
                PendingReports = pendingReports,
                ResolvedReports = resolvedReports,
                DismissedReports = dismissedReports,
                ReportsByReason = reportsByReason,
                RecentReports = recentReports
            };
        }

        public async Task<bool> ResolveReportAsync(int reportId, string resolution, int adminId)
        {
            var report = await _context.Reports.FindAsync(reportId);
            if (report == null)
                return false;


            report.Status = "Resolved";
            report.AdminResponse = resolution;
            report.ResolvedAt = DateTime.UtcNow;


            await _context.SaveChangesAsync();

            // Notificar al usuario que reportó
            await _notificationService.CreateNotificationAsync(
                report.ReporterId,
                "report_update",
                $"Tu reporte ha sido resuelto: {resolution}",
                reportId
            );

            return true;
        }

        public async Task<bool> DismissReportAsync(int reportId, string reason, int adminId)
        {
            var report = await _context.Reports.FindAsync(reportId);
            if (report == null)
                return false;

            report.Status = "Rejected";
            report.AdminResponse = reason;
            report.ResolvedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notificar al usuario que reportó
            await _notificationService.CreateNotificationAsync(
                report.ReporterId,
                "report_update",
                $"Tu reporte ha sido desestimado: {reason}",
                reportId
            );

            return true;
        }

        public async Task<bool> SuspendUserAsync(int userId, string reason, int adminId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.IsActive = false;

            await _context.SaveChangesAsync();

            // Notificar al usuario suspendido
            await _notificationService.CreateNotificationAsync(
                userId,
                "system",
                $"Tu cuenta ha sido suspendida: {reason}",
                null
            );

            return true;
        }

        public async Task<bool> ActivateUserAsync(int userId, int adminId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.IsActive = true;

            await _context.SaveChangesAsync();

            // Notificar al usuario activado
            await _notificationService.CreateNotificationAsync(
                userId,
                "system",
                "Tu cuenta ha sido reactivada",
                null
            );

            return true;
        }

        public async Task<bool> RemoveProductAsync(int productId, string reason, int adminId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
                return false;

            product.IsActive = false;

            await _context.SaveChangesAsync();

            // Notificar al propietario del producto
            await _notificationService.CreateNotificationAsync(
                product.SellerId,
                "system",
                $"Tu producto '{product.Title}' ha sido removido: {reason}",
                productId
            );

            return true;
        }
    }
}

