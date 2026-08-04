using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BackendPortalAPI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferenceId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedFor = table.Column<string>(type: "text", nullable: false),
                    LookingFor = table.Column<string>(type: "text", nullable: false),
                    Mobile = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Gender = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    Height = table.Column<string>(type: "text", nullable: true),
                    MaritalStatus = table.Column<string>(type: "text", nullable: false),
                    MotherTongue = table.Column<string>(type: "text", nullable: false),
                    Denomination = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    HomeParish = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Congregation = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    AboutFaith = table.Column<string>(type: "text", nullable: true),
                    Education = table.Column<string>(type: "text", nullable: true),
                    Profession = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    FatherOccupation = table.Column<string>(type: "text", nullable: true),
                    MotherOccupation = table.Column<string>(type: "text", nullable: true),
                    MainPhotoUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_profiles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "profiles",
                columns: new[] { "Id", "AboutFaith", "City", "Congregation", "CreatedAt", "CreatedFor", "DateOfBirth", "Denomination", "Education", "FatherOccupation", "FullName", "Gender", "Height", "HomeParish", "IsDeleted", "LookingFor", "MainPhotoUrl", "MaritalStatus", "Mobile", "MotherOccupation", "MotherTongue", "Profession", "ReferenceId", "Status", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111101"), "Active in church fellowship and ministry.", "Dubai, UAE", "Dubai", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Self", new DateOnly(2000, 6, 15), "CSI", "Master's (M.Sc Nursing)", null, "Abinaya R.", "Female", "5'4\"", "CSI Tamil Parish, Dubai", false, "Groom", null, "Never married", "+971 50 000 0000", null, "Tamil", "Staff Nurse", "CSI1042", "Verified", null },
                    { new Guid("11111111-1111-1111-1111-111111111102"), "Active in church fellowship and ministry.", "Fujairah, UAE", "Fujairah", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Self", new DateOnly(1997, 6, 15), "CSI", "Bachelor's (B.E)", null, "Daniel J.", "Male", "5'10\"", "CSI Tamil Congregation, Fujairah", false, "Bride", null, "Never married", "+971 50 000 0000", null, "Tamil", "Software Engineer", "CSI1043", "Verified", null },
                    { new Guid("11111111-1111-1111-1111-111111111103"), "Active in church fellowship and ministry.", "Dubai, UAE", "Dubai", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Self", new DateOnly(2002, 6, 15), "Pentecostal", "Bachelor's (B.Com)", null, "Sharon P.", "Female", "5'2\"", "Bethel AG Church, Dubai", false, "Groom", null, "Never married", "+971 50 000 0000", null, "Tamil", "Accountant", "CSI1044", "Active", null },
                    { new Guid("11111111-1111-1111-1111-111111111104"), "Active in church fellowship and ministry.", "Ras Al Khaimah, UAE", "Ras Al Khaimah", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Self", new DateOnly(1995, 6, 15), "CSI", "Doctorate (PhD)", null, "Immanuel S.", "Male", "6'0\"", "CSI Tamil Congregation, Ras Al Khaimah", false, "Bride", null, "Never married", "+971 50 000 0000", null, "Tamil", "College Lecturer", "CSI1045", "Verified", null },
                    { new Guid("11111111-1111-1111-1111-111111111105"), "Active in church fellowship and ministry.", "London, UK", "Other", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Self", new DateOnly(1998, 6, 15), "CSI", "Master's (M.A)", null, "Rebecca A.", "Female", "5'5\"", "CSI Tamil Fellowship, London", false, "Groom", null, "Never married", "+971 50 000 0000", null, "Tamil", "School Teacher", "CSI1046", "Active", null },
                    { new Guid("11111111-1111-1111-1111-111111111106"), "Active in church fellowship and ministry.", "Chennai, India", "India", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Self", new DateOnly(1999, 6, 15), "Lutheran", "Bachelor's (B.Sc)", null, "Joel V.", "Male", "5'8\"", "TELC Church, Chennai", false, "Bride", null, "Never married", "+971 50 000 0000", null, "Tamil", "Lab Technician", "CSI1047", "Pending", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_profiles_ReferenceId",
                table: "profiles",
                column: "ReferenceId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "profiles");
        }
    }
}
