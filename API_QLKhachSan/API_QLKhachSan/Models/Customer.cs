using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace API_QLKhachSan.Models
{
    public class Customer
    {

        [Key] // đánh dấu khóa chính
        public int CustomerID { get; set; }
        public string FullName { get; set; }
        public string IdentityCard { get; set; }
        public string? PhoneNumber { get; set; }

        [JsonIgnore] // Tránh lỗi vòng lặp khi trả về JSON nếu bạn chưa cấu hình ở Program.cs
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
