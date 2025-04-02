using UTTianguisAPI.DTOs;

namespace UTTianguisAPI.Services
{
    public interface IRatingService
    {
        Task<bool> RateUserAsync(int raterId, CreateRatingDTO createRatingDto);
        Task<IEnumerable<RatingDTO>> GetUserRatingsAsync(int userId);
        Task<double> GetUserAverageRatingAsync(int userId);
    }
}

