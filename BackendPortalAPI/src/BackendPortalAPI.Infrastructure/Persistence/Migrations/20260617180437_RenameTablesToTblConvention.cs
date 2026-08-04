using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendPortalAPI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameTablesToTblConvention : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_profiles",
                table: "profiles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_admin_users",
                table: "admin_users");

            migrationBuilder.RenameTable(
                name: "profiles",
                newName: "TblProfiles");

            migrationBuilder.RenameTable(
                name: "admin_users",
                newName: "TblUsers");

            migrationBuilder.RenameIndex(
                name: "IX_profiles_ReferenceId",
                table: "TblProfiles",
                newName: "IX_TblProfiles_ReferenceId");

            migrationBuilder.RenameIndex(
                name: "IX_admin_users_Email",
                table: "TblUsers",
                newName: "IX_TblUsers_Email");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TblProfiles",
                table: "TblProfiles",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TblUsers",
                table: "TblUsers",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_TblUsers",
                table: "TblUsers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TblProfiles",
                table: "TblProfiles");

            migrationBuilder.RenameTable(
                name: "TblUsers",
                newName: "admin_users");

            migrationBuilder.RenameTable(
                name: "TblProfiles",
                newName: "profiles");

            migrationBuilder.RenameIndex(
                name: "IX_TblUsers_Email",
                table: "admin_users",
                newName: "IX_admin_users_Email");

            migrationBuilder.RenameIndex(
                name: "IX_TblProfiles_ReferenceId",
                table: "profiles",
                newName: "IX_profiles_ReferenceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_admin_users",
                table: "admin_users",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_profiles",
                table: "profiles",
                column: "Id");
        }
    }
}
