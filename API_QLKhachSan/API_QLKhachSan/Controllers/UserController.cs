using API_QLKhachSan.Data;
using API_QLKhachSan.Models;
using Microsoft.AspNetCore.Http;
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
    public class UserController : ControllerBase
    {
        private readonly HotelContext _context;
        private readonly IConfiguration _configuration;
        public UserController(HotelContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }
        //Lấy danh sách user
        [HttpGet] 
        public async Task<ActionResult<IEnumerable<User>>> GetUser()
        {
            return await _context.Users.ToListAsync();
        }
        //Tạo user mới
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            //Kiểm tra user đã tồn tại chưa
            if (_context.Users.Any(u => u.UserName == user.UserName))
            {
                return BadRequest(new { message = "Tên đăng nhập đã tồn tại" });
            }
            //user.UserID = -1;
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetUser", new { id = user.UserId }, user);
        }

        //Hàm cập nhât User
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, User user)
        {
            if(id != user.UserId)
            {
                return BadRequest("Id User không dúng");
            }    
            _context.Entry(user).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if(!UserExists(id))
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
        //Hàm xóa User
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if(user == null)
            {
                return NotFound();
            }    
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        //Lấy thông tin User
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<User>>> GetUser([FromQuery] int? id, [FromQuery] string? fullname)
        {    
            //tạo câu truy vấn
            var query = _context.Users.AsQueryable();
            if (id.HasValue)
            {
                query = query.Where(u => u.UserId == id.Value);
            }
            if(!string.IsNullOrEmpty(fullname))
            {
                query = query.Where(u => u.Fullname != null && u.Fullname.Contains( fullname));
            }    
            var users = await query.ToListAsync();  
            if(users.Count == 0)
            {
                return NotFound(new { massage = "Không tìm thấy user nào phù hợp" });
            }    
            return Ok(users); 
        }
        // Class hứng dữ liệu đăng nhập
        public class LoginModel
        {
            public required string UserName { get; set; }
            public required string Passwords { get; set; }
        }

        // --- HÀM LOGIN ĐÃ NÂNG CẤP ---
        [HttpPost("Login")]
        public async Task<ActionResult<string>> Login([FromBody] LoginModel loginData)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserName == loginData.UserName
                                       && u.Passwords == loginData.Passwords);

            if (user == null)
            {
                return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu" });
            }

            var expirationTime = DateTime.UtcNow.AddHours(1);
            var tokenString = GenerateToken(user, expirationTime);

            return Ok(new
            {
                token = tokenString,
                expiration = expirationTime,
                message = "Đăng nhập thành công",
                // THÊM DÒNG NÀY Ở ĐÂY:
                fullName = user.Fullname, // Giả sử cột trong DB của bạn là Fullname
                userName = user.UserName,
                userRole = user.Roles ?? "User"
            });
        }

        // --- HÀM RIÊNG ĐỂ TẠO TOKEN ---
        // Thêm tham số expireTime vào hàm
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

                // SỬ DỤNG THỜI GIAN ĐƯỢC TRUYỀN VÀO
                Expires = expireTime,

                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
        private bool UserExists(int id)
        {
            return _context.Users.Any(e=> e.UserId == id);
        }
    }
}
