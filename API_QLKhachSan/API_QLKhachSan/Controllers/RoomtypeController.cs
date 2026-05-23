using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API_QLKhachSan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomTypeController : ControllerBase
    {
        private readonly HotelContext _context;

        public RoomTypeController(HotelContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách tất cả loại phòng
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Roomtype>>> GetRoomTypess()
        {
            return await _context.RoomTypes.ToListAsync();
        }

        // 2. Lấy 1 loại phòng theo ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Roomtype>> GetRoomTypeById(int id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);

            if (roomType == null)
            {
                return NotFound();
            }

            return roomType;
        }

        // 3. Tạo loại phòng mới
        [HttpPost]
        public async Task<ActionResult<Roomtype>> PostRoomType(Roomtype roomType)
        {
            // Kiểm tra tên loại phòng đã tồn tại chưa
            if (_context.RoomTypes.Any(rt => rt.TypeName == roomType.TypeName))
            {
                return BadRequest(new { message = "Tên loại phòng đã tồn tại" });
            }

            _context.RoomTypes.Add(roomType);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRoomTypeById), new { id = roomType.RoomTypeID }, roomType);
        }

        // 4. Cập nhật loại phòng
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoomType(int id, Roomtype roomType)
        {
            if (id != roomType.RoomTypeID)
            {
                return BadRequest(new { message = "ID loại phòng không khớp" });
            }

            _context.Entry(roomType).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoomTypeExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // 5. Xóa loại phòng
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null)
            {
                return NotFound();
            }

            _context.RoomTypes.Remove(roomType);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 6. Tìm kiếm loại phòng
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<Roomtype>>> SearchRoomType(
            [FromQuery] int? id,
            [FromQuery] string? typeName,
            [FromQuery] decimal? minPriceHour,
            [FromQuery] decimal? maxPriceHour,
            [FromQuery] decimal? minPriceNight,
            [FromQuery] decimal? maxPriceNight)
        {
            var query = _context.RoomTypes.AsQueryable();

            // Tìm theo ID
            if (id.HasValue)
            {
                query = query.Where(rt => rt.RoomTypeID == id.Value);
            }

            // Tìm theo Tên loại phòng
            if (!string.IsNullOrEmpty(typeName))
            {
                query = query.Where(rt => rt.TypeName.Contains(typeName));
            }

            // Tìm theo khoảng giá theo giờ
            if (minPriceHour.HasValue)
            {
                query = query.Where(rt => rt.PricePerHour >= minPriceHour.Value);
            }
            if (maxPriceHour.HasValue)
            {
                query = query.Where(rt => rt.PricePerHour <= maxPriceHour.Value);
            }

            // Tìm theo khoảng giá qua đêm
            if (minPriceNight.HasValue)
            {
                query = query.Where(rt => rt.PricePerNight >= minPriceNight.Value);
            }
            if (maxPriceNight.HasValue)
            {
                query = query.Where(rt => rt.PricePerNight <= maxPriceNight.Value);
            }

            var result = await query.ToListAsync();

            if (result.Count == 0)
            {
                return NotFound(new { message = "Không tìm thấy loại phòng phù hợp" });
            }

            return Ok(result);
        }

        private bool RoomTypeExists(int id)
        {
            return _context.RoomTypes.Any(e => e.RoomTypeID == id);
        }
    }
}