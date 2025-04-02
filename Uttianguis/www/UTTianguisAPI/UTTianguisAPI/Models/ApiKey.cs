using System;
using System.ComponentModel.DataAnnotations;

namespace UTTianguisAPI.Models
{
    public class ApiKey
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public string Key { get; set; }

        [Required]
        public string Role { get; set; }

        public string Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ExpiresAt { get; set; }

        // Navigation property
        public virtual User User { get; set; }
    }
}

