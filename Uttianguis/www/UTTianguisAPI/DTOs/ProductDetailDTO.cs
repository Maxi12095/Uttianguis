using System;
using System.Collections.Generic;

namespace UTTianguisAPI.DTOs
{
    public class ProductDetailDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int SellerId { get; set; }
        public string SellerName { get; set; }
        public string SellerEmail { get; set; }
        public string SellerPhone { get; set; }
        public string SellerProfileImage { get; set; }
        public string Condition { get; set; }
        public string MeetingPoint { get; set; }
        public bool IsSold { get; set; }
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ProductImageDTO> Images { get; set; }
    }
}

