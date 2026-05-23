using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace API_QLKhachSan.Models
{
    public class Invoice
    {
        [Key]
        public int InvoiceID { get; set; }
        public int BookingID { get; set; }
        [ForeignKey("BookingID")]
        
        public virtual Booking? Booking { get; set; }

        public DateTime InvoiceDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal RoomSubTotal { get; set; } // Tiền phòng gốc

        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceSubTotal { get; set; } // Tổng tiền dịch vụ

        public double DiscountPercentage { get; set; } // % Giảm giá
        public double TaxPercentage { get; set; } // % VAT (thường là 8% hoặc 10%)

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; } // Con số cuối cùng khách phải trả

        public string PaymentMethod { get; set; } // Tiền mặt, Chuyển khoản, Thẻ
        public string StaffName { get; set; } // Tên nhân viên thực hiện thu tiền
    }
}
