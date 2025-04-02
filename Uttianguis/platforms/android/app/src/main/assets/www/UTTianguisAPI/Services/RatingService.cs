using Microsoft.EntityFrameworkCore;
using UTTianguisAPI.Data;
using UTTianguisAPI.DTOs;
using UTTianguisAPI.Models;

namespace UTTianguisAPI.Services
{
    public class RatingService : IRatingService
    {
        private readonly ApplicationDbContext _context;

        public RatingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> RateUserAsync(int raterId, CreateRatingDTO createRatingDto)
        {
            // Check if user exists
            var user = await _context.Users.FindAsync(createRatingDto.UserId);
            if (user == null)
            {
                return false;
            }

            // Check if rater exists
            var rater = await _context.Users.FindAsync(raterId);
            if (rater == null)
            {
                return false;
            }

            // Check if user is rating themselves
            if (raterId == createRatingDto.UserId)
            {
                return false;
            }

            // Check if user has already rated this user
            var existingRating = await _context.Ratings
                .FirstOrDefaultAsync(r => r.RaterId == raterId && r.UserId == createRatingDto.UserId);

            if (existingRating != null)
            {
                // Update existing rating
                existingRating.Value = createRatingDto.Value;
                existingRating.Comment = createRatingDto.Comment;
                _context.Ratings.Update(existingRating);
            }
            else
            {
                // Create new rating
                var rating = new Rating
                {
                    UserId = createRatingDto.UserId,
                    RaterId = raterId,
                    Value = createRatingDto.Value,
                    Comment = createRatingDto.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Ratings.Add(rating);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<RatingDTO>> GetUserRatingsAsync(int userId)
        {
            var ratings = await _context.Ratings
                .Include(r => r.User)
                .Include(r => r.Rater)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new RatingDTO
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    UserName = r.User.Name,
                    RaterId = r.RaterId,
                    RaterName = r.Rater.Name,
                    RaterProfileImageUrl = r.Rater.ProfileImage,
                    Value = r.Value,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return ratings;
        }

        public async Task<double> GetUserAverageRatingAsync(int userId)
        {
            var ratings = await _context.Ratings
                .Where(r => r.UserId == userId)
                .ToListAsync();

            if (!ratings.Any())
            {
                return 0;
            }

            return ratings.Average(r => r.Value);
        }
    }
}

