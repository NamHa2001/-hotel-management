namespace API_QLKhachSan.Models
{
    public class DashboardDto
    {
        public int TongPhong { get; set; }
        public int PhongDangThue { get; set; }
        public int PhongTrong { get; set; }
        public int PhongDangDon { get; set; }
        public int TongKhachHang { get; set; }
        public int TongDonDatPhong { get; set; }
        public int LuotCheckInTuan { get; set; }
        public decimal DoanhThuThang { get; set; }

        public List<string> RevenueLabels { get; set; } = new List<string>();
        public List<decimal> RevenueValues { get; set; } = new List<decimal>();
    }
}
