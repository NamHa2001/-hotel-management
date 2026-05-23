    using API_QLKhachSan.Data;
    using Microsoft.EntityFrameworkCore;
    using System.Text.Json.Serialization;

    namespace API_QLKhachSan
    {
        public class Program
        {
            public static void Main(string[] args)
            {
                var builder = WebApplication.CreateBuilder(args);

                // 1. Kết nối Database (Giữ nguyên)
                builder.Services.AddDbContext<HotelContext>(option => option.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

                // ⭐ 2. THÊM CẤU HÌNH CORS Ở ĐÂY (Để cho phép Angular kết nối)
                builder.Services.AddCors(options =>
                {
                    options.AddPolicy("AllowAll", policy =>
                    {
                        policy.AllowAnyOrigin()  // Cho phép tất cả nguồn (Angular localhost:4200...)
                              .AllowAnyMethod()  // Cho phép mọi hành động (GET, POST, PUT, DELETE...)
                              .AllowAnyHeader(); // Cho phép mọi header
                    });
                });

                // Add services to the container.
                builder.Services.AddControllers().AddJsonOptions(x =>
                {
                    // Cấu hình này giúp bỏ qua các vòng lặp quan hệ (Circular Reference)
                    // Đảm bảo tên thuộc tính luôn viết thường chữ cái đầu (camelCase)
                    x.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                    x.JsonSerializerOptions.WriteIndented = true;
                });

                // Config Swagger
                builder.Services.AddEndpointsApiExplorer();
                builder.Services.AddSwaggerGen();

                var app = builder.Build();

                // Configure the HTTP request pipeline.
                if (app.Environment.IsDevelopment())
                {
                    // Code cũ của bạn để trống
                }

                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API_QLKhachSan v1");
                    c.RoutePrefix = "swagger";
                });

            // app.UseHttpsRedirection(); 

            // ⭐ 3. KÍCH HOẠT CORS (QUAN TRỌNG: Phải đặt TRƯỚC UseAuthorization)
            app.UseCors("AllowAll");

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.MapFallbackToFile("index.html");

            app.Run();
        }
        }
    }