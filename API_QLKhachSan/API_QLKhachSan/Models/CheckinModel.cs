namespace API_QLKhachSan.Models
{
    public class CheckInModel
    {
        public int RoomID { get; set; }
        public string FullName { get; set; }
        public string IdentityCard { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime? CheckOutTime { get; set; }

        //Ten goi cua no la DTO, tao ra de hung du lieu khi request len API
    }
}
