using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UTTianguisAPI.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Price { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        public string Condition { get; set; } // nuevo, como_nuevo, buen_estado, con_uso, para_reparar

        public string MeetingPoint { get; set; }

        [Required]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "El número de WhatsApp debe tener 10 dígitos")]
        public string ContactWhatsapp { get; set; }

        [Required]
        public int SellerId { get; set; }

        public bool IsApproved { get; set; } = false;

        public bool IsSold { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Propiedades adicionales para AdminService
        public int? ApprovedById { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int? RejectedById { get; set; }
        public DateTime? RejectedAt { get; set; }
        public string RejectionReason { get; set; }

        // Navigation properties
        public virtual Category Category { get; set; }

        public virtual User Seller { get; set; }

        public virtual ICollection<ProductImage> Images { get; set; }

        [JsonIgnore]
        public virtual ICollection<Favorite> Favorites { get; set; }

        [JsonIgnore]
        public virtual ICollection<Report> Reports { get; set; }
    }
}

