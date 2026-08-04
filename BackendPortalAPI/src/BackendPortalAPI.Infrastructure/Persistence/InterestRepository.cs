using BackendPortalAPI.Application.Interests;
using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BackendPortalAPI.Infrastructure.Persistence;

public class InterestRepository(AppDbContext db) : IInterestRepository
{
    public async Task<IReadOnlyList<Interest>> ListAsync(CancellationToken ct = default) =>
        await db.Interests.AsNoTracking().OrderByDescending(i => i.CreatedAt).ToListAsync(ct);

    public async Task AddAsync(Interest interest, CancellationToken ct = default) =>
        await db.Interests.AddAsync(interest, ct);

    public async Task<bool> UpdateStatusAsync(Guid id, InterestStatus status, CancellationToken ct = default)
    {
        var interest = await db.Interests.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (interest is null) return false;
        interest.Status = status;
        interest.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
