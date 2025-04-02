using UTTianguisAPI.DTOs;

namespace UTTianguisAPI.Services
{
    public interface IFavoriteService
    {
        Task<bool> AddFavoriteAsync(int userId, int productId);
        Task<bool> RemoveFavoriteAsync(int userId, int productId);
        Task<IEnumerable<ProductListDTO>> GetUserFavoritesAsync(int userId);
        Task<bool> IsFavoriteAsync(int userId, int productId);
    }
}

