using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendPortalAPI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddContactRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerMemberId",
                table: "TblProfiles",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TblContactRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    RequesterCongregation = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    ProfileName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ProfileReferenceId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TblContactRequests", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111101"),
                column: "OwnerMemberId",
                value: new Guid("33333333-3333-3333-3333-333333333301"));

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111102"),
                column: "OwnerMemberId",
                value: new Guid("33333333-3333-3333-3333-333333333302"));

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111103"),
                column: "OwnerMemberId",
                value: new Guid("33333333-3333-3333-3333-333333333303"));

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111104"),
                column: "OwnerMemberId",
                value: new Guid("33333333-3333-3333-3333-333333333304"));

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111105"),
                column: "OwnerMemberId",
                value: new Guid("33333333-3333-3333-3333-333333333301"));

            migrationBuilder.UpdateData(
                table: "TblProfiles",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111106"),
                column: "OwnerMemberId",
                value: new Guid("33333333-3333-3333-3333-333333333302"));

            migrationBuilder.CreateIndex(
                name: "IX_TblProfiles_OwnerMemberId",
                table: "TblProfiles",
                column: "OwnerMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_TblContactRequests_OwnerMemberId",
                table: "TblContactRequests",
                column: "OwnerMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_TblContactRequests_RequesterMemberId_ProfileId",
                table: "TblContactRequests",
                columns: new[] { "RequesterMemberId", "ProfileId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TblContactRequests");

            migrationBuilder.DropIndex(
                name: "IX_TblProfiles_OwnerMemberId",
                table: "TblProfiles");

            migrationBuilder.DropColumn(
                name: "OwnerMemberId",
                table: "TblProfiles");
        }
    }
}
