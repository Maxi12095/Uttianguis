using System.Collections.Generic;
using System.Threading.Tasks;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationDTO>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 10);
        Task<NotificationDTO> GetNotificationByIdAsync(int id);
        Task<NotificationCountDTO> GetNotificationCountAsync(int userId);
        Task<NotificationDTO> CreateNotificationAsync(int userId, string type, string content, int? relatedId = null);
        Task<bool> MarkNotificationAsReadAsync(int id);
        Task<bool> MarkAllNotificationsAsReadAsync(int userId);
        Task<bool> DeleteNotificationAsync(int id);
    }
}

