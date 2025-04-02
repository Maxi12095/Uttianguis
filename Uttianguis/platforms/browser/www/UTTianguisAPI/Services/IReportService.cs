using UTTianguisAPI.DTOs;

namespace UTTianguisAPI.Services
{
    public interface IReportService
    {
        Task<bool> CreateReportAsync(int reporterId, CreateReportDTO createReportDto, string screenshotUrl);
        Task<ReportDTO> GetReportByIdAsync(int reportId);
        Task<IEnumerable<ReportDTO>> GetAllReportsAsync(string status = null);
        Task<bool> ResolveReportAsync(int reportId, int adminId, ResolveReportDTO resolveReportDto);
    }
}

