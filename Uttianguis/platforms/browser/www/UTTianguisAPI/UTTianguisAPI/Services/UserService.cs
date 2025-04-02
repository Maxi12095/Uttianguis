using System;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using UTTianguisAPI.Data;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Remove the GetUserIdFromToken method that uses JWT claims
        // Replace with a method that works with API Key claims
        public int GetUserIdFromClaims(ClaimsPrincipal principal)
        {
            // Obtener el claim de ID del usuario
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("API Key inválida o expirada");
            }

            // Convertir el valor del claim a entero
            if (!int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("ID de usuario inválido en la API Key");
            }

            return userId;
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<bool> RegisterUserAsync(RegisterDTO registerDto)
        {
            // Check if email is already registered
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                return false;
            }

            // Create new user
            var user = new User
            {
                Name = registerDto.Name,
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                PhoneNumber = registerDto.PhoneNumber,
                Role = "User",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<User> AuthenticateAsync(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            // Check if user exists and is active
            if (user == null || !user.IsActive)
            {
                return null;
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                return null;
            }

            return user;
        }

        public async Task<bool> UpdateProfileAsync(int userId, UpdateProfileDTO updateProfileDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            // Update user properties
            if (!string.IsNullOrEmpty(updateProfileDto.Name))
            {
                user.Name = updateProfileDto.Name;
            }

            if (!string.IsNullOrEmpty(updateProfileDto.PhoneNumber))
            {
                user.PhoneNumber = updateProfileDto.PhoneNumber;
            }

            user.Bio = updateProfileDto.Bio;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDTO changePasswordDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
            {
                return false;
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateProfileImageAsync(int userId, string imageUrl)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            user.ProfileImage = imageUrl;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserProfileDTO> GetUserProfileAsync(int userId, int? currentUserId = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return null;
            }

            // Get user ratings
            var ratings = await _context.Ratings
                .Where(r => r.UserId == userId)
                .ToListAsync();

            // Calculate average rating
            double averageRating = 0;
            if (ratings.Any())
            {
                averageRating = ratings.Average(r => r.Value);
            }

            // Get product count
            var productCount = await _context.Products
                .CountAsync(p => p.SellerId == userId);

            // Get sales count (products marked as sold)
            var salesCount = await _context.Products
                .CountAsync(p => p.SellerId == userId && p.IsSold);

            return new UserProfileDTO
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Bio = user.Bio,
                ProfileImageUrl = user.ProfileImage,
                CreatedAt = user.CreatedAt,
                AverageRating = averageRating,
                RatingCount = ratings.Count,
                ProductCount = productCount,
                SalesCount = salesCount
            };
        }

        public async Task<IEnumerable<ProductListDTO>> GetUserProductsAsync(int userId, int? currentUserId = null)
        {
            var query = _context.Products
                .Where(p => p.SellerId == userId && p.IsApproved)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new ProductListDTO
                {
                    Id = p.Id,
                    Title = p.Title,
                    Price = p.Price,
                    CategoryName = p.Category.Name,
                    Condition = p.Condition,
                    SellerName = p.Seller.Name,
                    CreatedAt = p.CreatedAt,
                    // Corregido para evitar el operador de propagación nula en expresiones LINQ
                    MainImageUrl = p.Images.Any()
                        ? (p.Images.FirstOrDefault(i => i.IsMainImage) != null
                            ? p.Images.FirstOrDefault(i => i.IsMainImage).ImageUrl
                            : p.Images.First().ImageUrl)
                        : "/images/default-product.jpg",
                    IsFavorite = currentUserId.HasValue && p.Favorites.Any(f => f.UserId == currentUserId.Value)
                });

            return await query.ToListAsync();
        }
    }
}

