using System;

namespace UTTianguisAPI.DTOs
{
    public class ApiKeyDTO
    {
        public string Key { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}

