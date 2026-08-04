using BackendPortalAPI.Domain.Common;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Domain.Entities;

/// <summary>
/// A staff account that can sign in to the admin portal - presbyter, moderator, office staff.
/// Distinct from a matrimony <see cref="Profile"/>.
/// </summary>
public class AdminUser : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Moderator"; // Diocese Admin / Parish Presbyter / Moderator / Office Staff
    public string Congregation { get; set; } = "Dubai (Main)";
    public AdminUserStatus Status { get; set; } = AdminUserStatus.Invited;
}
