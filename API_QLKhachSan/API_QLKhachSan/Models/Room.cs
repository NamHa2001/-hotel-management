using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic; // Thêm thư viện này để dùng ICollection

namespace API_QLKhachSan.Models
{
    public class Room
    {
        [Key]
        public int RoomID { get; set; }

        public string RoomNumber { get; set; }

        public int RoomTypeID { get; set; }

        public string? RoomStatus { get; set; }

        // Lưu ý: Sửa 'Roomtype' thành 'RoomType' cho đúng với tên class của bạn
        [ForeignKey("RoomTypeID")]
        public virtual Roomtype? RoomType { get; set; }

        // Khởi tạo List mới để tránh lỗi NullReference khi gọi .Add() hoặc .Count
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}