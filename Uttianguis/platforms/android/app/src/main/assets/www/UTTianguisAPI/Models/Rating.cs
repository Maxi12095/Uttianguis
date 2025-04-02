using System.ComponentModel.DataAnnotations;

namespace UTTianguisAPI.Models
{
    public class Rating
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; } // User being rated

        [Required]
        public int RaterId { get; set; } // User giving the rating

        [Required]
        [Range(1, 5)]
        public int Value { get; set; }

        [StringLength(500)]
        public string Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; }
        public virtual User Rater { get; set; }
    }
}

