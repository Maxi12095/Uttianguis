using System.ComponentModel.DataAnnotations;

namespace UTTianguisAPI.Models
{
    public class Report
    {
        public int Id { get; set; }

        [Required]
        public int ReporterId { get; set; }

        public int? ReportedUserId { get; set; }

        public int? ReportedProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string Subject { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public string ScreenshotUrl { get; set; }

        [Required]
        public string Status { get; set; } = "Pending"; // Pending, Resolved, Rejected

        public string AdminResponse { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ResolvedAt { get; set; }

        // Propiedades adicionales necesarias para AdminService
        public int? ResolvedById { get; set; }

        // Navigation properties
        public virtual User Reporter { get; set; }
        public virtual User ReportedUser { get; set; }
        public virtual Product ReportedProduct { get; set; }
    }
}

