using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API_QLKhachSan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // ✅ FIX Bug#23: Bảo vệ toàn bộ controller
    public class InvoicesController : ControllerBase
    {
        private readonly HotelContext _context;

        public InvoicesController(HotelContext context)
        {
            _context = context;
        }

        // POST: api/Invoices/ProcessCheckOut
        [HttpPost("ProcessCheckOut/{bookingId}")]
        public async Task<IActionResult> ProcessCheckOut(int bookingId, [FromBody] Invoice invoice)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Kiểm tra Booking có tồn tại không
                var booking = await _context.Bookings
                    .Include(b => b.Room)
                    .FirstOrDefaultAsync(b => b.BookingID == bookingId);

                if (booking == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin đặt phòng!" });
                }

                // 2. Lưu hóa đơn vào Database
                invoice.BookingID = bookingId;
                invoice.InvoiceDate = DateTime.Now; // Đảm bảo lấy thời gian thực tại Server
                _context.Invoices.Add(invoice);

                // 3. Cập nhật thông tin Check-out cho Booking
                booking.CheckOutTime = DateTime.Now;
                booking.RoomStatus = "đã thanh toán"; // ✅ FIX: Cập nhật trạng thái booking để Frontend nhận biết "Đã trả phòng"
                booking.IsInspected = true;            // ✅ FIX: Đánh dấu đã hoàn tất kiểm phòng khi thanh toán xong
                booking.TotalRoomPrice = invoice.RoomSubTotal; // ✅ FIX Bug#2: Ghi lại tiền phòng thực tế vào Booking để hiển thị đúng trong bảng Quản lý Đặt phòng

                // Ghi lại nhân viên thu tiền vào ghi chú kiểm phòng
                if (!string.IsNullOrEmpty(invoice.StaffName))
                {
                    booking.InspectionNote = $"Đã thanh toán - NV: {invoice.StaffName}";
                }

                // 4. Cập nhật trạng thái phòng sang "Cleaning" (chờ dọn dẹp)
                if (booking.Room != null)
                {
                    booking.Room.RoomStatus = "Cleaning";
                }

                // Lưu tất cả thay đổi
                await _context.SaveChangesAsync();

                // Xác nhận hoàn tất giao dịch
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Thanh toán và trả phòng thành công!",
                    invoiceId = invoice.InvoiceID
                });
            }
            catch (Exception ex)
            {
                // Nếu có lỗi, hủy bỏ mọi thay đổi để tránh sai lệch dữ liệu
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    message = "Lỗi hệ thống khi xử lý thanh toán",
                    error = ex.Message
                });
            }
        }
        // GET: api/Invoices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
        {
            // Lấy danh sách hóa đơn kèm thông tin Booking để có CustomerID
            return await _context.Invoices
                .Include(i => i.Booking)
                    .ThenInclude(b => b.Customer) // Chú thích: Lấy thông tin khách hàng từ bảng Booking
                .Include(i => i.Booking)
                    .ThenInclude(b => b.Room)     // Chú thích: Lấy thông tin phòng từ bảng Booking
                .OrderByDescending(i => i.InvoiceDate) // Chú thích: Sắp xếp hóa đơn mới nhất lên đầu
                .ToListAsync();
        }
        // Lấy thông tin hóa đơn theo ID (nếu cần in lại)
        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();
            return invoice;
        }

        // GET: api/Invoices/GetFullHistory/{id}
        [HttpGet("GetFullHistory/{id}")]
        public async Task<ActionResult> GetFullHistory(int id)
        {
            // Tìm hóa đơn kèm theo tất cả các mối quan hệ liên quan
            var invoice = await _context.Invoices
                .Include(i => i.Booking)
                    .ThenInclude(b => b.Customer) // Lấy thông tin khách hàng
                .Include(i => i.Booking)
                    .ThenInclude(b => b.Room)     // Lấy thông tin phòng
                .FirstOrDefaultAsync(i => i.InvoiceID == id);

            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn!" });

            // Lấy thêm danh sách dịch vụ chi tiết từ bảng ServiceOders của Booking đó
            var services = await _context.ServiceOders
                .Where(so => so.BookingID == invoice.BookingID)
                .Include(so => so.Service)
                .Select(so => new {
                    so.Service.ServiceName,
                    so.Quantity,
                    so.PriceAtOder,
                    Total = so.Quantity * so.PriceAtOder
                })
                .ToListAsync();

            return Ok(new
            {
                InvoiceInfo = invoice,
                ServiceDetails = services
            });
        }

        // GET: api/Invoices/GetRevenueStats
        [HttpGet("GetRevenueStats")]
        public async Task<IActionResult> GetRevenueStats([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            // Nếu không có tham số, mặc định lấy 7 ngày gần nhất (từ 00:00 hôm nay trở về trước)
            var start = startDate ?? DateTime.Today.AddDays(-6);
            var end = endDate ?? DateTime.Today.AddHours(23).AddMinutes(59).AddSeconds(59);

            // Lấy dữ liệu hóa đơn trong khoảng thời gian đã chọn
            var revenueData = await _context.Invoices
                .Where(i => i.InvoiceDate >= start && i.InvoiceDate <= end)
                .ToListAsync();

            // Tính toán số ngày chênh lệch để vẽ biểu đồ động
            int totalDays = (end.Date - start.Date).Days + 1;

            // Nếu khoảng cách quá lớn (> 31 ngày), bạn có thể giới hạn hoặc xử lý GroupBy theo tháng
            // Ở đây mình tối ưu vẽ biểu đồ theo từng ngày trong khoảng đã chọn
            var chartData = Enumerable.Range(0, totalDays)
                .Select(i => start.AddDays(i))
                .Select(d => new {
                    label = d.ToString("dd/MM"),
                    value = revenueData
                        .Where(r => r.InvoiceDate.Date == d.Date)
                        .Sum(r => r.TotalAmount)
                })
                .ToList();

            // Chỉ tính tổng doanh thu trong khoảng thời gian ĐANG LỌC
            var totalRoom = revenueData.Sum(i => i.RoomSubTotal);
            var totalService = revenueData.Sum(i => i.ServiceSubTotal);

            return Ok(new
            {
                chartData = chartData,
                roomRevenue = totalRoom,
                serviceRevenue = totalService,
                totalRevenue = totalRoom + totalService,
                // Trả về thêm thông tin khoảng thời gian để Frontend hiển thị tiêu đề
                displayRange = $"{start:dd/MM/yyyy} - {end:dd/MM/yyyy}"
            });
        }

        // GET: api/Invoices/GetServicePerformance
        [HttpGet("GetServicePerformance")]
        public async Task<IActionResult> GetServicePerformance()
        {
            // Báo cáo: Phân tích các dịch vụ mang lại lợi nhuận cao nhất
            var performance = await _context.ServiceOders
                .Include(so => so.Service)
                .GroupBy(so => so.Service.ServiceName)
                .Select(g => new {
                    ServiceName = g.Key,
                    UsageCount = g.Sum(so => so.Quantity),
                    Revenue = g.Sum(so => so.Quantity * so.PriceAtOder)
                })
                .OrderByDescending(x => x.Revenue)
                .Take(5) // Lấy top 5 dịch vụ tiêu biểu
                .ToListAsync();

            return Ok(performance);
        }
    }


}