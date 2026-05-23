using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API_QLKhachSan.Models
{
    public class Roomtype
    {
        [Key] // đánh dấu khóa chính
        public int RoomTypeID { get; set; }
        public string TypeName { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerHour { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerNight { get;set; }
    }
}
