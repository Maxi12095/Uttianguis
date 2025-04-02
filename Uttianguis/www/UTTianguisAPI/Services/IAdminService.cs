using System.Threading.Tasks;
using UTTianguisAPI.DTOs;

namespace UTTianguisAPI.Services
{
    public interface IAdminService
    {
        Task<AdminStatisticsDTO> GetDashboardStatisticsAsync();
        Task<ReportStatisticsDTO> GetReportStatisticsAsync();
        Task<bool> ResolveReportAsync(int reportId, string resolution, int adminId);
        Task<bool> DismissReportAsync(int reportId, string reason, int adminId);
        Task<bool> SuspendUserAsync(int userId, string reason, int adminId);
        Task<bool> ActivateUserAsync(int userId, int adminId);
        Task<bool> RemoveProductAsync(int productId, string reason, int adminId);
    }
}

