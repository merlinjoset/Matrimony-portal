using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Users;

public record AdminUserDto(
    Guid Id,
    string Name,
    string Email,
    string Role,
    string Congregation,
    AdminUserStatus Status,
    DateTime CreatedAt);

public class CreateAdminUserDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Moderator";
    public string Congregation { get; set; } = "Dubai (Main)";
}

/// <summary>Persistence contract for admin users (implemented in Infrastructure).</summary>
public interface IAdminUserRepository
{
    Task<IReadOnlyList<AdminUser>> ListAsync(CancellationToken ct = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
    Task<AdminUser?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(AdminUser user, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(Guid id, AdminUserStatus status, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

public interface IAdminUserService
{
    Task<IReadOnlyList<AdminUserDto>> ListAsync(CancellationToken ct = default);
    Task<AdminUserDto?> CreateAsync(CreateAdminUserDto dto, CancellationToken ct = default);
    Task<bool> SetStatusAsync(Guid id, AdminUserStatus status, CancellationToken ct = default);
}

internal static class AdminUserMappings
{
    public static AdminUserDto ToDto(this AdminUser u) =>
        new(u.Id, u.Name, u.Email, u.Role, u.Congregation, u.Status, u.CreatedAt);
}
