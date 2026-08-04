using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendPortalAPI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAgmMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TblAGMMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MembershipNo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Congregation = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    ContactNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TblAGMMembers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TblAGMMembers_MembershipNo",
                table: "TblAGMMembers",
                column: "MembershipNo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TblAGMMembers");
        }
    }
}
