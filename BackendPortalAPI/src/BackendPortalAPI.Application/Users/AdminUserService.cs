using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Users;

public class AdminUserService(IAdminUserRepository repo) : IAdminUserService
{
    public async Task<IReadOnlyList<AdminUserDto>> ListAsync(CancellationToken ct = default)
    {
        var users = await repo.ListAsync(ct);
        return users.Select(u => u.ToDto()).ToList();
    }

    public async Task<AdminUserDto?> CreateAsync(CreateAdminUserDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        if (await repo.EmailExistsAsync(email, ct))
            return null; // duplicate email

        var user = new AdminUser
        {
            Name = dto.Name.Trim(),
            Email = email,
            Role = dto.Role,
            Congregation = dto.Congregation,
            Status = AdminUserStatus.Invited,
        };
        await repo.AddAsync(user, ct);
        await repo.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public Task<bool> SetStatusAsync(Guid id, AdminUserStatus status, CancellationToken ct = default) =>
        repo.UpdateStatusAsync(id, status, ct);
}
