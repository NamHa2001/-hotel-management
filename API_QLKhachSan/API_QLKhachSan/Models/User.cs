using System.ComponentModel.DataAnnotations;

namespace API_QLKhachSan.Models
{
    public class User
    {
        [Key] // đánh dấu khóa chính
        public int UserId { get; set; }
        public required string UserName { get; set; } //required là bắt buộc nhập
        public required string Passwords { get; set; }
        public string? Fullname { get; set; } // '?' có thể để rỗng
        public string? Roles { get; set; } //quy định quyền

    }
}
