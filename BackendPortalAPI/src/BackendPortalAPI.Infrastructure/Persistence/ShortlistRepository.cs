using BackendPortalAPI.Application.Shortlists;
using BackendPortalAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BackendPortalAPI.Infrastructure.Persistence;

public class ShortlistRepository(AppDbContext db) : IShortlistRepository
{
    public async Task<IReadOnlyList<Guid>> GetProfileIdsAsync(Guid memberId, CancellationToken ct = default) =>
        await db.Shortlists.AsNoTracking()
            .Where(s => s.MemberId == memberId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => s.ProfileId)
            .ToListAsync(ct);

    public Task<bool> ExistsAsync(Guid memberId, Guid profileId, CancellationToken ct = default) =>
        db.Shortlists.AnyAsync(s => s.MemberId == memberId && s.ProfileId == profileId, ct);

    public async Task AddAsync(Guid memberId, Guid profileId, CancellationToken ct = default) =>
        await db.Shortlists.AddAsync(new Shortlist { MemberId = memberId, ProfileId = profileId }, ct);

    public async Task<bool> RemoveAsync(Guid memberId, Guid profileId, CancellationToken ct = default)
    {
        var row = await db.Shortlists.FirstOrDefaultAsync(s => s.MemberId == memberId && s.ProfileId == profileId, ct);
        if (row is null) return false;
        db.Shortlists.Remove(row);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
