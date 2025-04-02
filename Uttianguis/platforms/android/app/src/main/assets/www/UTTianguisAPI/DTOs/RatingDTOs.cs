using System.ComponentModel.DataAnnotations;

namespace UTTianguisAPI.DTOs
{
    public class CreateRatingDTO
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Value { get; set; }

        [StringLength(500)]
        public string Comment { get; set; }
    }

    public class RatingDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public int RaterId { get; set; }
        public string RaterName { get; set; }
        public string RaterProfileImageUrl { get; set; }
        public int Value { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

