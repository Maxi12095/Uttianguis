using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UTTianguisAPI.Data;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public class ApiKeyService : IApiKeyService
    {
        private readonly ApplicationDbContext _context;

        public ApiKeyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ApiKeyDTO> GenerateApiKeyAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return null;
            }

            // Generate a random API key
            var key = GenerateRandomKey();

            var apiKey = new ApiKey
            {
                UserId = userId,
                Key = key,
                Role = user.Role,
                Description = $"API Key for {user.Name}",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = null // No expiration for simplicity
            };

            _context.ApiKeys.Add(apiKey);
            await _context.SaveChangesAsync();

            return new ApiKeyDTO
            {
                Key = apiKey.Key,
                UserId = apiKey.UserId,
                UserName = user.Name,
                Role = apiKey.Role,
                CreatedAt = apiKey.CreatedAt,
                ExpiresAt = apiKey.ExpiresAt
            };
        }

        public async Task<ApiKeyDTO> GetApiKeyByKeyAsync(string key)
        {
            var apiKey = await _context.ApiKeys
                .Include(k => k.User)
                .FirstOrDefaultAsync(k => k.Key == key && k.IsActive);

            if (apiKey == null)
            {
                return null;
            }

            return new ApiKeyDTO
            {
                Key = apiKey.Key,
                UserId = apiKey.UserId,
                UserName = apiKey.User.Name,
                Role = apiKey.Role,
                CreatedAt = apiKey.CreatedAt,
                ExpiresAt = apiKey.ExpiresAt
            };
        }

        public async Task<IEnumerable<ApiKeyDTO>> GetApiKeysByUserIdAsync(int userId)
        {
            var apiKeys = await _context.ApiKeys
                .Include(k => k.User)
                .Where(k => k.UserId == userId && k.IsActive)
                .ToListAsync();

            return apiKeys.Select(k => new ApiKeyDTO
            {
                Key = k.Key,
                UserId = k.UserId,
                UserName = k.User.Name,
                Role = k.Role,
                CreatedAt = k.CreatedAt,
                ExpiresAt = k.ExpiresAt
            });
        }

        public async Task<bool> RevokeApiKeyAsync(string key)
        {
            var apiKey = await _context.ApiKeys.FirstOrDefaultAsync(k => k.Key == key);
            if (apiKey == null)
            {
                return false;
            }

            apiKey.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ValidateApiKeyAsync(string key)
        {
            var apiKey = await _context.ApiKeys.FirstOrDefaultAsync(k => k.Key == key && k.IsActive);
            if (apiKey == null)
            {
                return false;
            }

            if (apiKey.ExpiresAt.HasValue && apiKey.ExpiresAt.Value < DateTime.UtcNow)
            {
                return false;
            }

            return true;
        }

        private string GenerateRandomKey()
        {
            var bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "");
        }
    }
}

