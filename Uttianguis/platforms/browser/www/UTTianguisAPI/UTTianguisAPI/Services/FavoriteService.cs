using Microsoft.EntityFrameworkCore;
using UTTianguisAPI.Data;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public class FavoriteService : IFavoriteService
    {
        private readonly ApplicationDbContext _context;

        public FavoriteService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> AddFavoriteAsync(int userId, int productId)
        {
            // Check if product exists and is approved
            var product = await _context.Products.FindAsync(productId);
            if (product == null || !product.IsApproved)
            {
                return false;
            }

            // Check if already a favorite
            var existingFavorite = await _context.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId);

            if (existingFavorite != null)
            {
                return true; // Already a favorite
            }

            // Add to favorites
            var favorite = new Favorite
            {
                UserId = userId,
                ProductId = productId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Favorites.Add(favorite);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveFavoriteAsync(int userId, int productId)
        {
            var favorite = await _context.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId);

            if (favorite == null)
            {
                return false;
            }

            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<ProductListDTO>> GetUserFavoritesAsync(int userId)
        {
            var favorites = await _context.Favorites
                .Include(f => f.Product)
                .ThenInclude(p => p.Category)
                .Include(f => f.Product)
                .ThenInclude(p => p.Seller)
                .Include(f => f.Product)
                .ThenInclude(p => p.Images)
                .Where(f => f.UserId == userId && f.Product.IsApproved && !f.Product.IsSold)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new ProductListDTO
                {
                    Id = f.Product.Id,
                    Title = f.Product.Title,
                    Price = f.Product.Price,
                    CategoryName = f.Product.Category.Name,
                    Condition = f.Product.Condition,
                    SellerName = f.Product.Seller.Name,
                    CreatedAt = f.Product.CreatedAt,
                    MainImageUrl = f.Product.Images.FirstOrDefault(i => i.IsMainImage).ImageUrl ?? f.Product.Images.FirstOrDefault().ImageUrl,
                    IsFavorite = true
                })
                .ToListAsync();

            return favorites;
        }

        public async Task<bool> IsFavoriteAsync(int userId, int productId)
        {
            return await _context.Favorites
                .AnyAsync(f => f.UserId == userId && f.ProductId == productId);
        }
    }
}

