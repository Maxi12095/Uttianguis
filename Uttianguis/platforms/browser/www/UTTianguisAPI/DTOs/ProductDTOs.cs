using System.ComponentModel.DataAnnotations;

namespace UTTianguisAPI.DTOs
{
    public class CreateProductDTO
    {
        [Required]
        [StringLength(100)]
        public string Title { get; set; }

        [Required]
        [MinLength(50)]
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
    }

    public class ProductDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string Condition { get; set; }
        public string MeetingPoint { get; set; }
        public int SellerId { get; set; }
        public string SellerName { get; set; }
        public string SellerProfileImageUrl { get; set; }
        public string ContactWhatsapp { get; set; }
        public bool IsApproved { get; set; }
        public bool IsSold { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> ImageUrls { get; set; }
        public string MainImageUrl { get; set; }
        public bool IsFavorite { get; set; }
        public List<ProductImageDTO> Images { get; set; }
    }

    public class ProductListDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public decimal Price { get; set; }
        public string CategoryName { get; set; }
        public string Condition { get; set; }
        public string SellerName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string MainImageUrl { get; set; }
        public bool IsFavorite { get; set; }
    }

    public class UpdateProductDTO
    {
        [StringLength(100)]
        public string Title { get; set; }

        [MinLength(50)]
        public string Description { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? Price { get; set; }

        public int? CategoryId { get; set; }

        public string Condition { get; set; }

        public string MeetingPoint { get; set; }

        [RegularExpression(@"^\d{10}$", ErrorMessage = "El número de WhatsApp debe tener 10 dígitos")]
        public string ContactWhatsapp { get; set; }

        public bool? IsSold { get; set; }
    }
}

