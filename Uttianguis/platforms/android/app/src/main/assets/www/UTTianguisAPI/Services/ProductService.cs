using Microsoft.EntityFrameworkCore;
using UTTianguisAPI.Data;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;

        public ProductService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Método para crear un producto
        public async Task<int> CreateProductAsync(int userId, CreateProductDTO createProductDto)
        {
            var product = new Product
            {
                Title = createProductDto.Title,
                Description = createProductDto.Description,
                Price = createProductDto.Price,
                CategoryId = createProductDto.CategoryId,
                SellerId = userId,
                Condition = createProductDto.Condition,
                MeetingPoint = createProductDto.MeetingPoint,
                IsActive = true,
                IsApproved = false, // Requiere aprobación de administrador
                IsSold = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return product.Id;
        }

        // Método para añadir imagen a un producto
        public async Task<bool> AddProductImageAsync(int productId, string imageUrl, bool isMainImage)
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
            {
                return false;
            }

            // Contar imágenes existentes
            var existingImagesCount = await _context.ProductImages.CountAsync(pi => pi.ProductId == productId);

            // Limitar a un máximo de 5 imágenes por producto
            if (existingImagesCount >= 5)
            {
                return false;
            }

            // Si esta imagen será la principal, actualizar las demás
            if (isMainImage)
            {
                var existingImages = await _context.ProductImages
                    .Where(pi => pi.ProductId == productId)
                    .ToListAsync();

                foreach (var img in existingImages)
                {
                    img.IsMainImage = false;
                    _context.ProductImages.Update(img);
                }
            }

            var image = new ProductImage
            {
                ProductId = productId,
                ImageUrl = imageUrl,
                IsMainImage = isMainImage || existingImagesCount == 0, // Es la principal si se especifica o si es la primera
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductImages.Add(image);
            await _context.SaveChangesAsync();

            return true;
        }

        // Método para obtener un producto por ID
        public async Task<ProductDTO> GetProductByIdAsync(int productId, int? currentUserId = null)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                return null;
            }

            bool isFavorite = false;
            if (currentUserId.HasValue)
            {
                isFavorite = await _context.Favorites
                    .AnyAsync(f => f.ProductId == productId && f.UserId == currentUserId.Value);
            }

            return new ProductDTO
            {
                Id = product.Id,
                Title = product.Title,
                Description = product.Description,
                Price = product.Price,
                CategoryId = product.CategoryId,
                CategoryName = product.Category.Name,
                SellerId = product.SellerId,
                SellerName = product.Seller.Name,
                SellerProfileImageUrl = product.Seller.ProfileImage,
                Condition = product.Condition,
                MeetingPoint = product.MeetingPoint,
                ContactWhatsapp = product.ContactWhatsapp,
                IsSold = product.IsSold,
                IsApproved = product.IsApproved,
                CreatedAt = product.CreatedAt,
                Images = product.Images.Select(i => new ProductImageDTO
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
                    IsMainImage = i.IsMainImage
                }).ToList(),
                MainImageUrl = product.Images.Any()
                    ? product.Images.Where(i => i.IsMainImage).Select(i => i.ImageUrl).FirstOrDefault()
                      ?? product.Images.Select(i => i.ImageUrl).FirstOrDefault()
                    : "/images/default-product.jpg",
                IsFavorite = isFavorite
            };
        }

        // Método para obtener productos con filtros
        public async Task<IEnumerable<ProductListDTO>> GetProductsAsync(string category = null, string search = null, string condition = null, decimal? minPrice = null, decimal? maxPrice = null, int? currentUserId = null)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Images)
                .Where(p => p.IsActive && p.IsApproved && !p.IsSold)
                .AsQueryable();

            // Aplicar filtros
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(p => p.Category.Name.ToLower() == category.ToLower());
            }

            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(p => p.Title.ToLower().Contains(search) ||
                                        p.Description.ToLower().Contains(search));
            }

            if (!string.IsNullOrEmpty(condition))
            {
                query = query.Where(p => p.Condition.ToLower() == condition.ToLower());
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            var products = await query
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
                    MainImageUrl = p.Images.Any()
                        ? p.Images.Where(i => i.IsMainImage).Select(i => i.ImageUrl).FirstOrDefault()
                          ?? p.Images.Select(i => i.ImageUrl).FirstOrDefault()
                          ?? "/images/default-product.jpg"
                        : "/images/default-product.jpg",
                    IsFavorite = currentUserId.HasValue &&
                                _context.Favorites.Any(f => f.ProductId == p.Id && f.UserId == currentUserId.Value)
                })
                .ToListAsync();

            return products;
        }

        // Método para obtener productos destacados
        public async Task<IEnumerable<ProductListDTO>> GetFeaturedProductsAsync(int? currentUserId = null)
        {
            var featuredProducts = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Images)
                .Where(p => p.IsActive && p.IsApproved && !p.IsSold)
                .OrderByDescending(p => p.CreatedAt)
                .Take(8)
                .Select(p => new ProductListDTO
                {
                    Id = p.Id,
                    Title = p.Title,
                    Price = p.Price,
                    CategoryName = p.Category.Name,
                    Condition = p.Condition,
                    SellerName = p.Seller.Name,
                    CreatedAt = p.CreatedAt,
                    MainImageUrl = p.Images.Any()
                        ? p.Images.Where(i => i.IsMainImage).Select(i => i.ImageUrl).FirstOrDefault()
                          ?? p.Images.Select(i => i.ImageUrl).FirstOrDefault()
                          ?? "/images/default-product.jpg"
                        : "/images/default-product.jpg",
                    IsFavorite = currentUserId.HasValue &&
                                _context.Favorites.Any(f => f.ProductId == p.Id && f.UserId == currentUserId.Value)
                })
                .ToListAsync();

            return featuredProducts;
        }

        // Método para actualizar un producto
        public async Task<bool> UpdateProductAsync(int productId, int userId, UpdateProductDTO updateProductDto)
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null || (product.SellerId != userId && !await IsUserAdminAsync(userId)))
            {
                return false;
            }

            // Actualizar propiedades del producto
            if (!string.IsNullOrEmpty(updateProductDto.Title))
                product.Title = updateProductDto.Title;

            if (!string.IsNullOrEmpty(updateProductDto.Description))
                product.Description = updateProductDto.Description;

            if (updateProductDto.Price.HasValue)
                product.Price = updateProductDto.Price.Value;

            if (updateProductDto.CategoryId.HasValue)
                product.CategoryId = updateProductDto.CategoryId.Value;

            if (!string.IsNullOrEmpty(updateProductDto.Condition))
                product.Condition = updateProductDto.Condition;

            if (!string.IsNullOrEmpty(updateProductDto.MeetingPoint))
                product.MeetingPoint = updateProductDto.MeetingPoint;

            if (!string.IsNullOrEmpty(updateProductDto.ContactWhatsapp))
                product.ContactWhatsapp = updateProductDto.ContactWhatsapp;

            if (updateProductDto.IsSold.HasValue)
                product.IsSold = updateProductDto.IsSold.Value;

            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return true;
        }

        // Método para eliminar un producto
        public async Task<bool> DeleteProductAsync(int productId, int userId)
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null || (product.SellerId != userId && !await IsUserAdminAsync(userId)))
            {
                return false;
            }

            // En lugar de eliminar físicamente, marcamos como inactivo
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return true;
        }

        // Método para aprobar un producto (admin)
        public async Task<bool> ApproveProductAsync(int productId, int adminId)
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
            {
                return false;
            }

            // Verificar que el usuario es administrador
            if (!await IsUserAdminAsync(adminId))
            {
                return false;
            }

            product.IsApproved = true;
            product.UpdatedAt = DateTime.UtcNow;
            product.ApprovedById = adminId;
            product.ApprovedAt = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return true;
        }

        // Método para rechazar un producto (admin)
        public async Task<bool> RejectProductAsync(int productId, int adminId, string reason)
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
            {
                return false;
            }

            // Verificar que el usuario es administrador
            if (!await IsUserAdminAsync(adminId))
            {
                return false;
            }

            product.IsApproved = false;
            product.IsActive = false;
            product.RejectionReason = reason;
            product.UpdatedAt = DateTime.UtcNow;
            product.RejectedById = adminId;
            product.RejectedAt = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return true;
        }

        // Método para obtener productos pendientes de aprobación
        public async Task<IEnumerable<ProductListDTO>> GetPendingApprovalProductsAsync()
        {
            var pendingProducts = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Images)
                .Where(p => p.IsActive && !p.IsApproved && p.RejectedAt == null)
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
                    MainImageUrl = p.Images.Any()
                        ? p.Images.Where(i => i.IsMainImage).Select(i => i.ImageUrl).FirstOrDefault()
                          ?? p.Images.Select(i => i.ImageUrl).FirstOrDefault()
                          ?? "/images/default-product.jpg"
                        : "/images/default-product.jpg"
                })
                .ToListAsync();

            return pendingProducts;
        }

        // Método auxiliar para verificar si un usuario es administrador
        private async Task<bool> IsUserAdminAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            return user != null && user.Role == "Admin";
        }
    }
}

