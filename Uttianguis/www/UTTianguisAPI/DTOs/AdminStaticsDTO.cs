using System;
using System.Collections.Generic;

namespace UTTianguisAPI.DTOs
{
    public class AdminStatisticsDTO
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalProducts { get; set; }
        public int ActiveProducts { get; set; }
        public int SoldProducts { get; set; }
        public int PendingReports { get; set; }
        public int ResolvedReports { get; set; }
        public Dictionary<string, int> ProductsByCategory { get; set; }
        public Dictionary<string, int> ReportsByType { get; set; }
        public List<MonthlyStatDTO> MonthlyStats { get; set; }
    }

    public class MonthlyStatDTO
    {
        public string Month { get; set; }
        public int NewUsers { get; set; }
        public int NewProducts { get; set; }
        public int SoldProducts { get; set; }
    }

    public class ReportStatisticsDTO
    {
        public int TotalReports { get; set; }
        public int PendingReports { get; set; }
        public int ResolvedReports { get; set; }
        public int DismissedReports { get; set; }
        public Dictionary<string, int> ReportsByReason { get; set; }
        public List<RecentReportDTO> RecentReports { get; set; }
    }

    public class RecentReportDTO
    {
        public int Id { get; set; }
        public string ReporterName { get; set; }
        public string ReportedItemType { get; set; }
        public string Reason { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; }
    }
}

