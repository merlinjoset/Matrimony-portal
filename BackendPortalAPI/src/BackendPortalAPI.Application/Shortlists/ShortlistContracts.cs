using BackendPortalAPI.Application.Profiles;

namespace BackendPortalAPI.Application.Shortlists;

public interface IShortlistRepository
{
    Task<IReadOnlyList<Guid>> GetProfileIdsAsync(Guid memberId, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid memberId, Guid profileId, CancellationToken ct = default);
    Task AddAsync(Guid memberId, Guid profileId, CancellationToken ct = default);
    Task<bool> RemoveAsync(Guid memberId, Guid profileId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

public interface IShortlistService
{
    Task<IReadOnlyList<ProfileListItemDto>> ListAsync(Guid memberId, CancellationToken ct = default);
    Task AddAsync(Guid memberId, Guid profileId, CancellationToken ct = default);
    Task<bool> RemoveAsync(Guid memberId, Guid profileId, CancellationToken ct = default);
}

public class ShortlistService(IShortlistRepository repo, IProfileRepository profiles) : IShortlistService
{
    public async Task<IReadOnlyList<ProfileListItemDto>> ListAsync(Guid memberId, CancellationToken ct = default)
    {
        var ids = await repo.GetProfileIdsAsync(memberId, ct);
        if (ids.Count == 0) return [];

        var found = await profiles.GetByIdsAsync(ids, ct);
        var byId = found.ToDictionary(p => p.Id);
        // Preserve shortlist order (most-recent first, as returned by the repo).
        return ids
            .Where(byId.ContainsKey)
            .Select(id => byId[id].ToListItem())
            .ToList();
    }

    public async Task AddAsync(Guid memberId, Guid profileId, CancellationToken ct = default)
    {
        if (await repo.ExistsAsync(memberId, profileId, ct)) return; // idempotent
        await repo.AddAsync(memberId, profileId, ct);
        await repo.SaveChangesAsync(ct);
    }

    public Task<bool> RemoveAsync(Guid memberId, Guid profileId, CancellationToken ct = default) =>
        repo.RemoveAsync(memberId, profileId, ct);
}
