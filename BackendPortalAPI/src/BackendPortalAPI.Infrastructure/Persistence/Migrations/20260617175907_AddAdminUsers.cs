using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BackendPortalAPI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "admin_users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Congregation = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_users", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "admin_users",
                columns: new[] { "Id", "Congregation", "CreatedAt", "Email", "IsDeleted", "Name", "Role", "Status", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("22222222-2222-2222-2222-222222222201"), "Dubai (Main)", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "benjamin@csitamilparishdubai.com", false, "Rev. Benjamin", "Diocese Admin", "Active", null },
                    { new Guid("22222222-2222-2222-2222-222222222202"), "Dubai (Main)", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "presbyter@csitamilparishdubai.com", false, "Rev. S. Daniel", "Parish Presbyter", "Active", null },
                    { new Guid("22222222-2222-2222-2222-222222222203"), "Fujairah", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "moderator@csitamilparishdubai.com", false, "Sis. Mary J.", "Moderator", "Active", null },
                    { new Guid("22222222-2222-2222-2222-222222222204"), "Dubai (Main)", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "office@csitamilparishdubai.com", false, "Office Desk", "Office Staff", "Invited", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_admin_users_Email",
                table: "admin_users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_users");
        }
    }
}
