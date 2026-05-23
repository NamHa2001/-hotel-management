using System.Data.Common;
using API_QLKhachSan.Models;
using Microsoft.EntityFrameworkCore;
namespace API_QLKhachSan.Data
{
    public class HotelContext: DbContext
    {
        public HotelContext(DbContextOptions <HotelContext> options): base(options){} 
        public DbSet<User> Users { get; set; }
        public DbSet<Service> Servicess { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Roomtype> RoomTypes { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<ServiceOrder> ServiceOders { get; set; }
        protected override void OnModelCreating (ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Service>().ToTable("Servicess");
            base.OnModelCreating (modelBuilder);
        }
    }
}
