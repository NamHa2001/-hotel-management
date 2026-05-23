using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API_QLKhachSan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomController : ControllerBase
    {
        private readonly HotelContext _context;

        public RoomController(HotelContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách tất cả phòng (Kèm theo tên loại phòng cho dễ nhìn)
        // 1. Lấy danh sách tất cả phòng (Kèm Loại phòng và Lịch sử đặt)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Room>>> GetRooms()
        {
            return await _context.Rooms
                .Include(r => r.RoomType)
                .Include(r => r.Bookings)
                    .ThenInclude(b => b.Customer) // <--- MỚI: Từ Booking lấy tiếp Customer
                .ToListAsync();
        }
        // 2. Lấy chi tiết 1 phòng (Kèm Loại phòng và Lịch sử đặt)
        [HttpGet("{id}")]
        public async Task<ActionResult<Room>> GetRoom(int id)
        {
            var room = await _context.Rooms
                .Include(r => r.RoomType)
                .Include(r => r.Bookings)
                    .ThenInclude(b => b.Customer) // <--- MỚI: Từ Booking lấy tiếp Customer
                .FirstOrDefaultAsync(r => r.RoomID == id);

            if (room == null)
            {
                return NotFound();
            }

            return room;
        }

        // 3. Thêm phòng mới
        [HttpPost]
        public async Task<ActionResult<Room>> PostRoom(RoomCreateDto roomDto)
        {
            // 1. Kiểm tra xem Loại phòng có tồn tại trong DB không
            var roomTypeExists = await _context.RoomTypes.AnyAsync(rt => rt.RoomTypeID == roomDto.RoomTypeID);
            if (!roomTypeExists)
            {
                return BadRequest(new { message = "Mã loại phòng không tồn tại!" });
            }

            // 2. Kiểm tra xem số phòng này đã có ai đặt chưa
            if (await _context.Rooms.AnyAsync(r => r.RoomNumber == roomDto.RoomNumber))
            {
                return BadRequest(new { message = "Số phòng này đã tồn tại!" });
            }

            // 3. Khởi tạo đối tượng Room thực sự để lưu vào Database
            // Chúng ta chỉ gán những thông tin cơ bản, bỏ qua các bảng liên quan để tránh vòng lặp
            var room = new Room
            {
                RoomNumber = roomDto.RoomNumber,
                RoomTypeID = roomDto.RoomTypeID,
                RoomStatus = roomDto.RoomStatus
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            // 4. Trả về thông tin phòng vừa tạo (Gọi lại hàm GetRoom để trả về data chuẩn)
            return CreatedAtAction("GetRoom", new { id = room.RoomID }, room);
        }

        // 4. Cập nhật phòng
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRoom(int id, RoomCreateDto roomDto) // <--- Đổi sang dùng DTO cho đồng bộ
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return NotFound();

            // Kiểm tra loại phòng mới có tồn tại không
            if (!await _context.RoomTypes.AnyAsync(rt => rt.RoomTypeID == roomDto.RoomTypeID))
            {
                return BadRequest(new { message = "Mã loại phòng không tồn tại!" });
            }

            // Cập nhật từng trường một (Cách này cực kỳ an toàn, không lo lỗi vòng lặp)
            room.RoomNumber = roomDto.RoomNumber;
            room.RoomTypeID = roomDto.RoomTypeID;
            room.RoomStatus = roomDto.RoomStatus;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoomExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // 5. Xóa phòng
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var room = await _context.Rooms
                .Include(r => r.Bookings) // Lấy kèm thông tin booking để kiểm tra
                .FirstOrDefaultAsync(r => r.RoomID == id);

            if (room == null) return NotFound();

            // KIỂM TRA: Nếu phòng đã có lịch sử đặt phòng thì không cho xóa 
            // (Để bảo vệ dữ liệu doanh thu)
            if (room.Bookings != null && room.Bookings.Any())
            {
                return BadRequest(new { message = "Không thể xóa phòng này vì đã có dữ liệu đặt phòng!" });
            }

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool RoomExists(int id)
        {
            return _context.Rooms.Any(e => e.RoomID == id);
        }
    }
}