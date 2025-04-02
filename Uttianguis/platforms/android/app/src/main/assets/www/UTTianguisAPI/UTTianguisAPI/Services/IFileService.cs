using Microsoft.AspNetCore.Http;

namespace UTTianguisAPI.Services
{
    public interface IFileService
    {
        Task<string> SaveImageAsync(IFormFile file, string folder);
        bool DeleteImage(string imageUrl);
    }
}

