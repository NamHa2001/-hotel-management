using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API_QLKhachSan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // ✅ FIX Bug#23: Bảo vệ toàn bộ controller
    public class OderServicesController : ControllerBase
    {
        private readonly HotelContext _context;
        public OderServicesController(HotelContext context)
        {
            _context = context;
        }

        // 1. LẤY DANH SÁCH TOÀN BỘ DỊCH VỤ (MENU)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Service>>> GetServices()
        {
            try
            {
                // Truy cập vào bảng Servicess và lấy toàn bộ danh sách
                var services = await _context.Servicess.ToListAsync();

                // Trả về danh sách kèm trạng thái 200 OK
                return Ok(services);
            }
            catch (Exception ex)
            {
                // Trả về lỗi 500 nếu có vấn đề hệ thống
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách dịch vụ", error = ex.Message });
            }
        }


        // Thêm vào trong OderServicesController
        [HttpGet("GetUsedServices/{bookingId}")]
        public async Task<ActionResult> GetUsedServices(int bookingId)
        {
            var usedServices = await _context.ServiceOders
                .Where(bs => bs.BookingID == bookingId)
                .Include(bs => bs.Service) // Đảm bảo đã Load thông tin Service để lấy tên và giá
                .Select(bs => new {
                    ServiceID = bs.ServiceID,
                    ServiceName = bs.Service.ServiceName,
                    Price = bs.PriceAtOder, // Lấy giá lúc đặt để chính xác tuyệt đối
                    Quantity = bs.Quantity
                })
                .ToListAsync();

            return Ok(usedServices);
        }


        [HttpPost]
        public async Task<IActionResult> OrderService([FromBody] OderRequest oderRequest)
        {
            if (oderRequest.Quantity <= 0)
            {
                return BadRequest(new { message = "Số lượng dịch vụ phải lớn hơn 0!" });
            }
            // 1. Kiểm tra booking có tồn tại không?
            var booking = await _context.Bookings.FindAsync(oderRequest.BookingID);

            // Lưu ý: Chỉ cần kiểm tra CheckOutTime == null là biết khách đang ở
            if (booking == null || booking.CheckOutTime != null)
            {
                return BadRequest(new { message = "Booking không tồn tại hoặc khách đã trả phòng!" });
            }

            // 2. Kiểm tra Dịch vụ có tồn tại trong Menu không?
            var service = await _context.Servicess.FindAsync(oderRequest.ServiceID);
            if (service == null)
            {
                return NotFound(new { message = "Không tìm thấy dịch vụ trong hệ thống" });
            }

            // 3. Tạo Oder service với giá thực tế từ Database
            var newOrder = new ServiceOrder
            {
                BookingID = oderRequest.BookingID,
                ServiceID = oderRequest.ServiceID,
                Quantity = oderRequest.Quantity,
                OderTime = DateTime.Now,
                // Lấy giá thực tế của dịch vụ tại thời điểm gọi món
                PriceAtOder = service.Price
            };

            _context.ServiceOders.Add(newOrder);
            await _context.SaveChangesAsync();

            // 4. Trả về kết quả đầy đủ để Angular hiển thị thông báo
            return Ok(new
            {
                message = "Order dịch vụ thành công!",
                serviceName = service.ServiceName,
                quantity = newOrder.Quantity,
                pricePerUnit = newOrder.PriceAtOder,
                totalPrice = newOrder.PriceAtOder * newOrder.Quantity,
                orderTime = newOrder.OderTime
            });
        }                     


        public class OderRequest
        {
            public int BookingID { get; set; }
            public int ServiceID { get; set; }
            public int Quantity { get; set; }
        }
    }
}