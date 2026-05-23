using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API_QLKhachSan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceController : ControllerBase
    {
        private readonly HotelContext _context;

        public ServiceController(HotelContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách tất cả Service
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Service>>> GetServices()
        {
            return await _context.Servicess.ToListAsync();
        }

        // 2. Lấy 1 Service theo ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Service>> GetServiceById(int id)
        {
            var service = await _context.Servicess.FindAsync(id);

            if (service == null)
            {
                return NotFound();
            }

            return service;
        }

        // 3. Tạo Service mới
        [HttpPost]
        public async Task<ActionResult<Service>> PostService(Service service)
        {
            // Kiểm tra tên dịch vụ đã tồn tại chưa
            if (_context.Servicess.Any(s => s.ServiceName == service.ServiceName))
            {
                return BadRequest(new { message = "Tên dịch vụ đã tồn tại" });
            }

            _context.Servicess.Add(service);
            await _context.SaveChangesAsync();

            // Trả về mã 201 Created
            return CreatedAtAction(nameof(GetServiceById), new { id = service.ServiceID }, service);
        }

        // 4. Cập nhật Service
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateService(int id, Service service)
        {
            if (id != service.ServiceID)
            {
                return BadRequest(new { message = "ID Dịch vụ không khớp" });
            }

            _context.Entry(service).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceExists(id))
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

        // 5. Xóa Service
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteService(int id)
        {
            var service = await _context.Servicess.FindAsync(id);
            if (service == null)
            {
                return NotFound();
            }

            _context.Servicess.Remove(service);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Lấy danh sách dịch vụ đã lưu cho một Booking cụ thể
       

        // 6. Tìm kiếm Service
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<Service>>> SearchService([FromQuery] int? id, [FromQuery] string? name, [FromQuery] string? unit, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice)
        {
            var query = _context.Servicess.AsQueryable();

            // Tìm theo ID
            if (id.HasValue)
            {
                query = query.Where(s => s.ServiceID == id.Value);
            }

            // Tìm theo Tên
            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(s => s.ServiceName.Contains(name));
            }

            // Tìm theo Đơn vị tính
            if (!string.IsNullOrEmpty(unit))
            {
                query = query.Where(s => s.Unit != null && s.Unit.Contains(unit));
            }

            // (Mới thêm) Tìm theo khoảng giá
            if (minPrice.HasValue)
            {
                query = query.Where(s => s.Price >= minPrice.Value);
            }
            if (maxPrice.HasValue)
            {
                query = query.Where(s => s.Price <= maxPrice.Value);
            }

            var services = await query.ToListAsync();

            if (services.Count == 0)
            {
                return NotFound(new { message = "Không tìm thấy dịch vụ nào phù hợp" });
            }

            return Ok(services);
        }

        private bool ServiceExists(int id)
        {
            return _context.Servicess.Any(e => e.ServiceID == id);
        }
    }
}