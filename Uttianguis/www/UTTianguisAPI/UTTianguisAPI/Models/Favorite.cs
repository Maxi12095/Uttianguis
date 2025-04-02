namespace UTTianguisAPI.Models
{
    public class Favorite
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User User { get; set; }
        public virtual Product Product { get; set; }
    }
}

