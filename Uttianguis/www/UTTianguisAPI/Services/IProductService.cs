using UTTianguisAPI.DTOs;

namespace UTTianguisAPI.Services
{
    public interface IProductService
    {
        Task<int> CreateProductAsync(int userId, CreateProductDTO createProductDto);
        Task<bool> AddProductImageAsync(int productId, string imageUrl, bool isMainImage);
        Task<ProductDTO> GetProductByIdAsync(int productId, int? currentUserId = null);
        Task<IEnumerable<ProductListDTO>> GetProductsAsync(string category = null, string search = null, string condition = null, decimal? minPrice = null, decimal? maxPrice = null, int? currentUserId = null);
        Task<IEnumerable<ProductListDTO>> GetFeaturedProductsAsync(int? currentUserId = null);
        Task<bool> UpdateProductAsync(int productId, int userId, UpdateProductDTO updateProductDto);
        Task<bool> DeleteProductAsync(int productId, int userId);
        Task<bool> ApproveProductAsync(int productId, int adminId);
        Task<bool> RejectProductAsync(int productId, int adminId, string reason);
        Task<IEnumerable<ProductListDTO>> GetPendingApprovalProductsAsync();
    }
}

