using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UTTianguisAPI.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        [JsonIgnore]
        public string PasswordHash { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [StringLength(500)]
        public string Bio { get; set; } = "N/A";

        public string ProfileImage { get; set; } = "https://google.com.mx";

        [Required]
        public string Role { get; set; } = "User"; // User, Admin

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        // Navigation properties
        [JsonIgnore]
        public virtual ICollection<Product> Products { get; set; }

        [JsonIgnore]
        public virtual ICollection<Favorite> Favorites { get; set; }

        [JsonIgnore]
        public virtual ICollection<Rating> ReceivedRatings { get; set; }

        [JsonIgnore]
        public virtual ICollection<Rating> GivenRatings { get; set; }

        [JsonIgnore]
        public virtual ICollection<Report> ReportsSubmitted { get; set; }

        [JsonIgnore]
        public virtual ICollection<Report> ReportsAgainstUser { get; set; }
    }
}

