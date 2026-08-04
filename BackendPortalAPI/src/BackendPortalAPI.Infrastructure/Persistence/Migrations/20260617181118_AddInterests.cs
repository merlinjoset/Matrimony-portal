using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendPortalAPI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInterests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TblInterests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ToProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ToReferenceId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FromName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FromMobile = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TblInterests", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TblInterests_ToProfileId",
                table: "TblInterests",
                column: "ToProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TblInterests");
        }
    }
}
