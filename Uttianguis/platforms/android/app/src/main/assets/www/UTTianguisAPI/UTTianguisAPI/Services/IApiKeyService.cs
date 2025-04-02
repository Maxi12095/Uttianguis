using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public interface IApiKeyService
    {
        Task<ApiKeyDTO> GenerateApiKeyAsync(int userId);
        Task<ApiKeyDTO> GetApiKeyByKeyAsync(string key);
        Task<IEnumerable<ApiKeyDTO>> GetApiKeysByUserIdAsync(int userId);
        Task<bool> RevokeApiKeyAsync(string key);
        Task<bool> ValidateApiKeyAsync(string key);
    }
}

