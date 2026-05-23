namespace API_QLKhachSan.Models
{
    public class RoomCreateDto
    {
        public string RoomNumber { get; set; }
        public int RoomTypeID { get; set; }
        public string RoomStatus { get; set; } = "Available";
    }
}
