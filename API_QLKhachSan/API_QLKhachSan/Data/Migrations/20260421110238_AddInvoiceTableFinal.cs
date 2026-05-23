using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API_QLKhachSan.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceTableFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                 name: "Invoices",
                 columns: table => new
                 {
                     InvoiceID = table.Column<int>(type: "int", nullable: false)
                         .Annotation("SqlServer:Identity", "1, 1"),
                     BookingID = table.Column<int>(type: "int", nullable: false),
                     InvoiceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                     RoomSubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                     ServiceSubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                     DiscountPercentage = table.Column<double>(type: "float", nullable: false),
                     TaxPercentage = table.Column<double>(type: "float", nullable: false),
                     TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                     PaymentMethod = table.Column<string>(type: "nvarchar(max)", nullable: true),
                     StaffName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                 },
                 constraints: table =>
                 {
                     table.PrimaryKey("PK_Invoices", x => x.InvoiceID);
                     table.ForeignKey(
                         name: "FK_Invoices_Bookings_BookingID",
                         column: x => x.BookingID,
                         principalTable: "Bookings",
                         principalColumn: "BookingID",
                         onDelete: ReferentialAction.Cascade);
                 });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_BookingID",
                table: "Invoices",
                column: "BookingID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Invoices");

        }
    }
}
