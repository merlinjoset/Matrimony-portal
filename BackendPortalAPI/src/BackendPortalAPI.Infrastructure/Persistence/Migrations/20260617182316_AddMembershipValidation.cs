using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BackendPortalAPI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMembershipValidation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MembershipNo",
                table: "TblProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TblMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MembershipNo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Congregation = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TblMembers", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "TblMembers",
                columns: new[] { "Id", "Congregation", "CreatedAt", "IsActive", "IsDeleted", "MembershipNo", "Name", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("33333333-3333-3333-3333-333333333301"), "Dubai", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, false, "CSI-DXB-1001", "Mr. & Mrs. Rajesh Daniel", null },
                    { new Guid("33333333-3333-3333-3333-333333333302"), "Dubai", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, false, "CSI-DXB-1002", "Mr. & Mrs. Samuel John", null },
                    { new Guid("33333333-3333-3333-3333-333333333303"), "Fujairah", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, false, "CSI-FUJ-2001", "Mr. & Mrs. Christopher", null },
                    { new Guid("33333333-3333-3333-3333-333333333304"), "Ras Al Khaimah", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, false, "CSI-RAK-3001", "Mr. & Mrs. Wilson", null },
                    { new Guid("33333333-3333-3333-3333-333333333305"), "Dubai", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, false, "CSI-DXB-9999", "Lapsed Membership", null }
                });

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111101"),
                column: "MembershipNo",
                value: null);

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111102"),
                column: "MembershipNo",
                value: null);

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111103"),
                column: "MembershipNo",
                value: null);

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111104"),
                column: "MembershipNo",
                value: null);

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111105"),
                column: "MembershipNo",
                value: null);

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111106"),
                column: "MembershipNo",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_TblMembers_MembershipNo",
                table: "TblMembers",
                column: "MembershipNo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TblMembers");

            migrationBuilder.DropColumn(
                name: "MembershipNo",
                table: "TblProfiles");
        }
    }
}
