using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API_QLKhachSan.Models
{
    public class ServiceOrder
    {
        [Key]
        public int OderID { get; set; }
        public int Quantity { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceAtOder { get; set; }
        public DateTime OderTime { get; set; }
        public int BookingID { get; set; }
        [ForeignKey("BookingID")]
        public virtual Booking? Booking { get; set; }
        public int ServiceID { get; set; }
        [ForeignKey("ServiceID")]
        public virtual Service? Service { get; set; }


    }
}
