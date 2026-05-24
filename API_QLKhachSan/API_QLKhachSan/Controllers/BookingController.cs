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
    public class BookingController : ControllerBase
    {
        private readonly HotelContext _context;

        public BookingController(HotelContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Booking>>> GetBookings()
        {
            return await _context.Bookings
                .Include(b => b.Room)
                    .ThenInclude(r => r.RoomType)
                .Include(b => b.Customer)
                .OrderByDescending(b => b.CheckInTime)
                .ToListAsync();
        }
        [HttpPost]
        [AllowAnonymous] // ✅ FIX Bug#23: User đặt phòng không cần đăng nhập
        public async Task<ActionResult<Booking>> PostBooking([FromBody] Booking newBooking)
        {
            // 0. Kiểm tra nếu dữ liệu gửi lên bị null
            if (newBooking == null)
            {
                return BadRequest(new { message = "Dữ liệu đặt phòng không hợp lệ!" });
            }

            // 1. Kiểm tra phòng có tồn tại không và lấy đối tượng Room ra
            var room = await _context.Rooms.FindAsync(newBooking.RoomID);
            if (room == null)
            {
                return BadRequest(new { message = "Mã phòng (RoomID) không tồn tại!" });
            }

            // 2. Kiểm tra xem phòng có đang sẵn sàng không (Tránh đặt đè lên phòng đang có khách)
            if (room.RoomStatus == "Occupied")
            {
                return BadRequest(new { message = "Phòng này hiện đang có khách, không thể đặt thêm!" });
            }

            // 3. Kiểm tra khách hàng có tồn tại không
            var customerExists = await _context.Customers.AnyAsync(c => c.CustomerID == newBooking.CustomerID);
            if (!customerExists)
            {
                return BadRequest(new { message = "Mã khách hàng (CustomerID) không tồn tại!" });
            }

            try
            {
                // 4. CẬP NHẬT TRẠNG THÁI PHÒNG: Đây là bước quan trọng nhất
                room.RoomStatus = "Occupied";

                // 5. Lưu thông tin đặt phòng vào Database
                _context.Bookings.Add(newBooking);

                // SaveChanges sẽ lưu cả Booking mới VÀ trạng thái mới của Room
                await _context.SaveChangesAsync();

                // 6. Trả về kết quả
                return CreatedAtAction(nameof(GetBookings), new { id = newBooking.BookingID }, newBooking);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống: " + ex.Message });
            }
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBooking(int id, Booking booking)
        {
            if (id != booking.BookingID) return BadRequest();

            _context.Entry(booking).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Bookings.Any(e => e.BookingID == id)) return NotFound();
                else throw;
            }
            return NoContent();
        }
        [HttpPost("checkout/{bookingId}")]
        public async Task<IActionResult> PostCheckOut(int bookingId, [FromBody] Invoice invoiceData)
        {
            // 1. Tìm thông tin Booking kèm Room
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .FirstOrDefaultAsync(b => b.BookingID == bookingId);

            if (booking == null) return NotFound(new { message = "Không tìm thấy thông tin đặt phòng." });

            try
            {
                // 2. Gán các thông tin tự động cho Invoice
                invoiceData.BookingID = bookingId;
                invoiceData.InvoiceDate = DateTime.Now;

                // 3. Lưu hóa đơn vào bảng Invoices
                _context.Invoices.Add(invoiceData);

                // 4. Cập nhật trạng thái Booking và Phòng
                booking.CheckOutTime = DateTime.Now;
                booking.RoomStatus = "đã thanh toán"; // Trạng thái của đơn đặt

                if (booking.Room != null)
                {
                    booking.Room.RoomStatus = "Cleaning"; // Phòng chuyển sang chờ dọn dẹp
                }

                // 5. Lưu tất cả thay đổi xuống DB
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Check-out và lưu hóa đơn thành công!",
                    invoiceId = invoiceData.InvoiceID
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lưu hóa đơn: " + ex.Message });
            }
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .FirstOrDefaultAsync(b => b.BookingID == id);

            if (booking == null) return NotFound();

            // Khi huỷ booking đang Occupied, giải phóng phòng về Available
            if (booking.Room != null && booking.RoomStatus == "Occupied")
            {
                booking.Room.RoomStatus = "Available";
            }

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("MarkInspected/{id}")]
        public async Task<IActionResult> MarkInspected(int id, [FromBody] string note)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            booking.IsInspected = true;
            booking.InspectionNote = note;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã lưu trạng thái kiểm phòng thành công!" });
        }
    }
}