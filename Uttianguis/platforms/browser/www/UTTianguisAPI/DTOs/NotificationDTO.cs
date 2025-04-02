using System;

namespace UTTianguisAPI.DTOs
{
    public class NotificationDTO
    {
        public int Id { get; set; }
        public string Type { get; set; }
        public string Content { get; set; }
        public int? RelatedId { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class NotificationCountDTO
    {
        public int TotalCount { get; set; }
        public int UnreadCount { get; set; }
    }
}

