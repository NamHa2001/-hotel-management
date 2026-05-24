using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API_QLKhachSan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly HotelContext _context;

        public CustomerController(HotelContext context)
        {
            _context = context;
        }

        // Lấy danh sách Customer
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
        {
            return await _context.Customers.ToListAsync();
        }

        // Tạo Customer mới
        [HttpPost]
        public async Task<ActionResult<Customer>> PostCustomer(Customer customer)
        {
            // ✅ FIX Bug#4: Chỉ kiểm tra trùng CCCD khi giá trị thực sự được cung cấp.
            // Nếu khách đặt phòng từ User side không có CCCD (null / rỗng) thì bỏ qua kiểm tra.
            // Điều này tránh lỗi 400 "CCCD đã tồn tại" khi nhiều khách online đặt phòng mà không nhập CCCD.
            if (!string.IsNullOrWhiteSpace(customer.IdentityCard)
                && _context.Customers.Any(c => c.IdentityCard == customer.IdentityCard))
            {
                return BadRequest(new { message = "Số CMND/CCCD đã tồn tại trong hệ thống" });
            }

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Trả về thông tin khách hàng vừa tạo
            return CreatedAtAction(nameof(GetCustomers), new { id = customer.CustomerID }, customer);
        }

        // Hàm cập nhật Customer
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, Customer customer)
        {
            if (id != customer.CustomerID)
            {
                return BadRequest("Id Khách hàng không đúng");
            }

            _context.Entry(customer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerExists(id))
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

        // Hàm xóa Customer
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound();
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Tìm kiếm Customer (Mở rộng thêm tìm theo CMND và SĐT )
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchCustomer(
             [FromQuery] int? id,
             [FromQuery] string? fullname,
             [FromQuery] string? identityCard,
             [FromQuery] string? phoneNumber)
        {
            try
            {
                // 1. Sử dụng Include để kéo dữ liệu Bookings về kiểm tra trạng thái
                var query = _context.Customers
                    .Include(c => c.Bookings)
                    .AsQueryable();

                // 2. Các logic lọc (ID, FullName, IdentityCard, PhoneNumber)
                if (id.HasValue)
                {
                    query = query.Where(c => c.CustomerID == id.Value);
                }
                else
                {
                    if (!string.IsNullOrEmpty(fullname))
                    {
                        query = query.Where(c => c.FullName.Contains(fullname));
                    }

                    // Tìm kiếm HOẶC (CCCD hoặc SĐT) cho ô nhập liệu duy nhất trên Angular
                    if (!string.IsNullOrEmpty(identityCard) && !string.IsNullOrEmpty(phoneNumber))
                    {
                        query = query.Where(c => c.IdentityCard.Contains(identityCard) ||
                                               c.PhoneNumber.Contains(phoneNumber));
                    }
                    else
                    {
                        if (!string.IsNullOrEmpty(identityCard))
                            query = query.Where(c => c.IdentityCard.Contains(identityCard));

                        if (!string.IsNullOrEmpty(phoneNumber))
                            query = query.Where(c => c.PhoneNumber.Contains(phoneNumber));
                    }
                }

                var customers = await query.ToListAsync();

                // 3. Trả về Object đã được tính toán trạng thái lưu trú
                var result = customers.Select(c => new {
                    c.CustomerID,
                    c.FullName,
                    c.IdentityCard,
                    c.PhoneNumber,
                    // Dùng CheckOutTime (khớp với model Booking của bạn)
                    // Nếu CheckOutTime là null nghĩa là khách chưa trả phòng
                    IsStaying = c.Bookings != null && c.Bookings.Any(b => b.CheckOutTime == null),

                    // Trả về danh sách số phòng khách đang ở để hiện thông báo cho hay
                    CurrentRoomIDs = c.Bookings?
                        .Where(b => b.CheckOutTime == null)
                        .Select(b => b.RoomID).ToList()
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetTotalCustomers()
        {
            // Đếm trực tiếp từ bảng Customer trong cơ sở dữ liệu
            var count = await _context.Customers.CountAsync();

            // Trả về con số tổng
            return Ok(count);
        }
        private bool CustomerExists(int id)
        {
            return _context.Customers.Any(e => e.CustomerID == id);
        }
    }
}