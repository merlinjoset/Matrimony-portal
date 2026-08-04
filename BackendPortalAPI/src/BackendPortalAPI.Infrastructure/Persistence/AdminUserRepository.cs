using BackendPortalAPI.Application.Users;
using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BackendPortalAPI.Infrastructure.Persistence;

public class AdminUserRepository(AppDbContext db) : IAdminUserRepository
{
    public async Task<IReadOnlyList<AdminUser>> ListAsync(CancellationToken ct = default) =>
        await db.AdminUsers.AsNoTracking().OrderByDescending(u => u.CreatedAt).ToListAsync(ct);

    public Task<bool> EmailExistsAsync(string email, CancellationToken ct = default) =>
        db.AdminUsers.AnyAsync(u => u.Email == email, ct);

    public Task<AdminUser?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.AdminUsers.FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task AddAsync(AdminUser user, CancellationToken ct = default) =>
        await db.AdminUsers.AddAsync(user, ct);

    public async Task<bool> UpdateStatusAsync(Guid id, AdminUserStatus status, CancellationToken ct = default)
    {
        var user = await db.AdminUsers.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;
        user.Status = status;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
