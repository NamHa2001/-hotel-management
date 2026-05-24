using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace API_QLKhachSan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // ✅ FIX Bug#23: Bảo vệ toàn bộ controller — chỉ user đã đăng nhập mới dùng được
    public class UserController : ControllerBase
    {
        private readonly HotelContext _context;
        private readonly IConfiguration _configuration;

        public UserController(HotelContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Lấy danh sách user (chỉ Admin)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<User>>> GetUser()
        {
            return await _context.Users.ToListAsync();
        }

        // ✅ FIX Bug#22: Hash mật khẩu trước khi lưu
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            if (_context.Users.Any(u => u.UserName == user.UserName))
            {
                return BadRequest(new { message = "Tên đăng nhập đã tồn tại" });
            }

            // Hash password với BCrypt trước khi lưu vào DB
            user.Passwords = BCrypt.Net.BCrypt.HashPassword(user.Passwords);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetUser", new { id = user.UserId }, user);
        }

        // Cập nhật User — hash lại mật khẩu nếu có thay đổi
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(int id, User user)
        {
            if (id != user.UserId)
            {
                return BadRequest("Id User không đúng");
            }

            // Nếu password được gửi lên không phải dạng hash (< 60 ký tự), thì hash lại
            if (!string.IsNullOrWhiteSpace(user.Passwords) && user.Passwords.Length < 60)
            {
                user.Passwords = BCrypt.Net.BCrypt.HashPassword(user.Passwords);
            }

            _context.Entry(user).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id)) return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("Search")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<User>>> GetUser([FromQuery] int? id, [FromQuery] string? fullname)
        {
            var query = _context.Users.AsQueryable();
            if (id.HasValue) query = query.Where(u => u.UserId == id.Value);
            if (!string.IsNullOrEmpty(fullname))
                query = query.Where(u => u.Fullname != null && u.Fullname.Contains(fullname));

            var users = await query.ToListAsync();
            if (users.Count == 0)
                return NotFound(new { message = "Không tìm thấy user nào phù hợp" });
            return Ok(users);
        }

        // Class hứng dữ liệu đăng nhập
        public class LoginModel
        {
            public required string UserName { get; set; }
            public required string Passwords { get; set; }
        }

        // ✅ FIX Bug#22 + Bug#23: Login không cần [Authorize], nhưng xác thực bằng BCrypt
        [HttpPost("Login")]
        [AllowAnonymous] // Endpoint public — không cần token
        public async Task<ActionResult<string>> Login([FromBody] LoginModel loginData)
        {
            // Tìm user theo username (không so sánh password ở DB để hỗ trợ hash)
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserName == loginData.UserName);

            if (user == null)
            {
                return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu" });
            }

            // ✅ FIX Bug#22: Kiểm tra mật khẩu qua BCrypt
            // Hỗ trợ backward compatibility: thử BCrypt trước, nếu fail thì thử plain text
            // (dành cho tài khoản cũ chưa được hash) và tự động migrate sang hash
            bool passwordValid = false;
            bool needsMigration = false;

            if (user.Passwords.StartsWith("$2"))
            {
                // Mật khẩu đã được hash — verify bình thường
                passwordValid = BCrypt.Net.BCrypt.Verify(loginData.Passwords, user.Passwords);
            }
            else
            {
                // Mật khẩu chưa hash (tài khoản cũ) — so sánh plain text và đánh dấu cần migrate
                passwordValid = user.Passwords == loginData.Passwords;
                if (passwordValid) needsMigration = true;
            }

            if (!passwordValid)
            {
                return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu" });
            }

            // ✅ Auto-migrate: hash mật khẩu plain text của tài khoản cũ khi đăng nhập thành công
            if (needsMigration)
            {
                user.Passwords = BCrypt.Net.BCrypt.HashPassword(loginData.Passwords);
                await _context.SaveChangesAsync();
            }

            var expirationTime = DateTime.UtcNow.AddHours(8); // Token hết hạn sau 8 tiếng
            var tokenString = GenerateToken(user, expirationTime);

            return Ok(new
            {
                token = tokenString,
                expiration = expirationTime,
                message = "Đăng nhập thành công",
                fullName = user.Fullname,
                userName = user.UserName,
                userRole = user.Roles ?? "User"
            });
        }

        private string GenerateToken(User user, DateTime expireTime)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Role, user.Roles ?? "User")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expireTime,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private bool UserExists(int id) => _context.Users.Any(e => e.UserId == id);
    }
}
