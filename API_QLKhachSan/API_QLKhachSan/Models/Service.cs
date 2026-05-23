using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API_QLKhachSan.Models
{
    public class Service
    {
        [Key]
        public int ServiceID { get; set; }
        public required string ServiceName { get; set; }//Nước ngọt, mì tôm
        public string? Unit { get; set; } //Lon, gói
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price {  get; set; }
        //public ICollection<ServiceOder> ServiceOders { get; set; }
    }
}
