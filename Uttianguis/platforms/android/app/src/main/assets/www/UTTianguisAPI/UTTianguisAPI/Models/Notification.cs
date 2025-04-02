using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UTTianguisAPI.Models
{
    public class Notification
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } // new_message, product_interest, product_sold, new_rating, system, report_update

        [Required]
        public string Content { get; set; }

        public int? RelatedId { get; set; } // ID del objeto relacionado (producto, usuario, etc.)

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navegación
        [ForeignKey("UserId")]
        public User User { get; set; }
    }
}

