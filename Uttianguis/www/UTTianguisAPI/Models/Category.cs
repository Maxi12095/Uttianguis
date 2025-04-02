using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace UTTianguisAPI.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Name { get; set; }

        // Navigation properties
        [JsonIgnore]
        public virtual ICollection<Product> Products { get; set; }
    }
}

