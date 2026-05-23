using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace API_QLKhachSan.Models
{
    public class Booking
    {
        [Key]
        public int BookingID { get; set; }

        public string? RoomStatus { get; set; }

        [Required]
        public DateTime CheckInTime { get; set; }

        public DateTime? CheckOutTime { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalRoomPrice { get; set; }

        public bool IsInspected { get; set; } = false;
        public string? InspectionNote { get; set; }

        // Khóa ngoại liên kết tới bảng Room
        [Required]
        public int RoomID { get; set; }

        [ForeignKey("RoomID")]
        // Đã xóa JsonIgnore để Angular có thể nhận được dữ liệu Room nếu cần
        public virtual Room? Room { get; set; }

        // Khóa ngoại liên kết tới bảng Customer
        [Required]
        public int CustomerID { get; set; }

        [ForeignKey("CustomerID")]
        // QUAN TRỌNG: Đã xóa JsonIgnore để Angular lấy được tên khách hàng (Customer.FullName)
        public virtual Customer? Customer { get; set; }

        // Tính toán nhanh số giờ đã ở (Không lưu xuống Database)
        [NotMapped]
        public double TotalHours => CheckOutTime.HasValue
            ? (CheckOutTime.Value - CheckInTime).TotalHours
            : (DateTime.Now - CheckInTime).TotalHours;
    }
}