using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API_QLKhachSan.Controllers
{
    [Route("api/Dashboard")]
    [ApiController]
    [Authorize] // ✅ FIX Bug#23: Bảo vệ toàn bộ controller
    public class DashboardDtoController : ControllerBase
    {
        private readonly HotelContext _context;

        public DashboardDtoController(HotelContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<DashboardDto>> GetDashboardSummary()
        {
            var now = DateTime.Now;
            var firstDayOfMonth = new DateTime(now.Year, now.Month, 1);

            // 1. Sửa logic tính doanh thu: Dùng Contains hoặc ToLower để tránh lỗi viết hoa/thường/dấu
            // Tính doanh thu tháng dựa trên tổng tiền các Hóa đơn phát sinh từ đầu tháng
            var doanhThuThang = await _context.Invoices
                .Where(i => i.InvoiceDate >= firstDayOfMonth)
                .SumAsync(i => i.TotalAmount);

            // 2. Tính số lượng phòng theo trạng thái
            var phongDangThue = await _context.Rooms.CountAsync(r => r.RoomStatus == "Occupied");
            var phongTrong = await _context.Rooms.CountAsync(r => r.RoomStatus == "Available");
            var phongDangDon = await _context.Rooms.CountAsync(r => r.RoomStatus == "Cleaning"); // Bổ sung thêm trạng thái dọn phòng

            // 3. Tính lượt Check-in trong tuần (bắt đầu Thứ Hai — chuẩn ISO/Việt Nam)
            // ✅ FIX Bug L: DayOfWeek.Sunday=0 → Sunday cần lùi 6 ngày; các ngày khác lùi (dayOfWeek - 1)
            var dayOfWeek = (int)now.DayOfWeek;
            var daysFromMonday = dayOfWeek == 0 ? 6 : dayOfWeek - 1;
            var startOfWeek = now.AddDays(-daysFromMonday).Date;
            var luotCheckInTuan = await _context.Bookings
                .CountAsync(b => b.CheckInTime >= startOfWeek);

            var summary = new DashboardDto
            {
                TongKhachHang = await _context.Customers.CountAsync(),
                TongDonDatPhong = await _context.Bookings.CountAsync(),
                TongPhong = await _context.Rooms.CountAsync(),
                PhongDangThue = phongDangThue,
                PhongTrong = phongTrong,
                PhongDangDon = phongDangDon, // Đảm bảo DTO có trường này
                LuotCheckInTuan = luotCheckInTuan,
                DoanhThuThang = doanhThuThang
            };
            // ✅ FIX Bug#19: Tải toàn bộ invoice 7 ngày 1 lần, tránh N+1 query (7 query riêng lẻ)
            var startOf7Days = DateTime.Today.AddDays(-6);
            var invoiceLast7Days = await _context.Invoices
                .Where(i => i.InvoiceDate.Date >= startOf7Days)
                .Select(i => new { i.InvoiceDate, i.TotalAmount })
                .ToListAsync();

            var last7Days = Enumerable.Range(0, 7)
                .Select(i => DateTime.Today.AddDays(-6 + i))
                .ToList();

            summary.RevenueLabels = last7Days.Select(d => d.ToString("dd/MM")).ToList();
            summary.RevenueValues = last7Days.Select(d =>
                invoiceLast7Days
                    .Where(i => i.InvoiceDate.Date == d.Date)
                    .Sum(i => i.TotalAmount)
            ).ToList();
            return Ok(summary);

        }
    }
}
