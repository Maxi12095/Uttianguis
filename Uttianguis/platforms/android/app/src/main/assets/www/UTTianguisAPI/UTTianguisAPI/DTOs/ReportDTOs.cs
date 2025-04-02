using System.ComponentModel.DataAnnotations;

namespace UTTianguisAPI.DTOs
{
    public class CreateReportDTO
    {
        public int? ReportedUserId { get; set; }

        public int? ReportedProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string Subject { get; set; }

        [Required]
        public string Description { get; set; }

        // The screenshot will be handled separately as IFormFile
    }

    public class ReportDTO
    {
        public int Id { get; set; }
        public int ReporterId { get; set; }
        public string ReporterName { get; set; }
        public int? ReportedUserId { get; set; }
        public string ReportedUserName { get; set; }
        public int? ReportedProductId { get; set; }
        public string ReportedProductTitle { get; set; }
        public string Subject { get; set; }
        public string Description { get; set; }
        public string ScreenshotUrl { get; set; }
        public string Status { get; set; }
        public string AdminResponse { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }

    public class ResolveReportDTO
    {
        [Required]
        public string Status { get; set; } // Resolved, Rejected

        [Required]
        public string AdminResponse { get; set; }
    }
}

