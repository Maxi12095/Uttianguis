using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Services;

namespace UTTianguisAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly IUserService _userService;

        public NotificationsController(INotificationService notificationService, IUserService userService)
        {
            _notificationService = notificationService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDTO>>> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = _userService.GetUserIdFromClaims(User);
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
            return Ok(notifications);
        }

        [HttpGet("count")]
        public async Task<ActionResult<NotificationCountDTO>> GetNotificationCount()
        {
            var userId = _userService.GetUserIdFromClaims(User);
            var count = await _notificationService.GetNotificationCountAsync(userId);
            return Ok(count);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NotificationDTO>> GetNotification(int id)
        {
            var userId = _userService.GetUserIdFromClaims(User);
            var notification = await _notificationService.GetNotificationByIdAsync(id);

            if (notification == null)
                return NotFound();

            return Ok(notification);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var result = await _notificationService.MarkNotificationAsReadAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = _userService.GetUserIdFromClaims(User);
            var result = await _notificationService.MarkAllNotificationsAsReadAsync(userId);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var result = await _notificationService.DeleteNotificationAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}

