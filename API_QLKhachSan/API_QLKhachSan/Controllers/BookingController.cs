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
                // 4. ✅ FIX: Tự động đóng booking "mồ côi" cũ cho phòng này trước khi tạo mới.
                // Xảy ra khi admin đã reset phòng thủ công (không qua Checkout), các booking cũ
                // vẫn còn roomStatus='Occupied' nhưng không có checkOutTime.
                var orphanedBookings = await _context.Bookings
                    .Where(b => b.RoomID == newBooking.RoomID && b.CheckOutTime == null && b.RoomStatus == "Occupied")
                    .ToListAsync();
                foreach (var b in orphanedBookings)
                {
                    b.RoomStatus = "Cancelled";
                }

                // 5. CẬP NHẬT TRẠNG THÁI PHÒNG: Đây là bước quan trọng nhất
                room.RoomStatus = "Occupied";

                // 6. Lưu thông tin đặt phòng vào Database
                _context.Bookings.Add(newBooking);

                // SaveChanges sẽ lưu cả Booking mới VÀ trạng thái mới của Room VÀ các booking cũ đã đóng
                await _context.SaveChangesAsync();

                // 7. Trả về kết quả
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
        // ✅ FIX Bug B: Đã xóa PostCheckOut khỏi BookingController.
        // Endpoint POST /api/Booking/checkout/{id} là dead code — frontend chỉ dùng
        // InvoicesController.ProcessCheckOut (POST /api/Invoices/ProcessCheckOut/{id})
        // vốn đã xử lý đầy đủ: RoomStatus, TotalRoomPrice, IsInspected, transaction.
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