using System.Security.Claims;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public interface IUserService
    {
        Task<User> GetUserByIdAsync(int id);
        Task<User> GetUserByEmailAsync(string email);
        Task<bool> RegisterUserAsync(RegisterDTO registerDto);
        Task<User> AuthenticateAsync(string email, string password);
        Task<bool> UpdateProfileAsync(int userId, UpdateProfileDTO updateProfileDto);
        Task<bool> ChangePasswordAsync(int userId, ChangePasswordDTO changePasswordDto);
        Task<bool> UpdateProfileImageAsync(int userId, string imageUrl);
        Task<UserProfileDTO> GetUserProfileAsync(int userId, int? currentUserId = null);
        Task<IEnumerable<ProductListDTO>> GetUserProductsAsync(int userId, int? currentUserId = null);
        int GetUserIdFromClaims(ClaimsPrincipal user);
    }
}


