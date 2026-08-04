using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendPortalAPI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShortlists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TblShortlists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TblShortlists", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TblShortlists_MemberId",
                table: "TblShortlists",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_TblShortlists_MemberId_ProfileId",
                table: "TblShortlists",
                columns: new[] { "MemberId", "ProfileId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TblShortlists");
        }
    }
}
