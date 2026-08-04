using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Profiles;

/// <summary>Persistence contract for profiles (implemented in Infrastructure).</summary>
public interface IProfileRepository
{
    Task<(IReadOnlyList<Profile> Items, int Total)> QueryAsync(ProfileQuery query, CancellationToken ct = default);
    Task<Profile?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Profile>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default);
    Task<Profile?> GetByReferenceIdAsync(string referenceId, CancellationToken ct = default);
    Task<int> CountAsync(CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(Guid id, ProfileStatus status, string? note = null, CancellationToken ct = default);
    Task<Dictionary<ProfileStatus, int>> CountByStatusAsync(CancellationToken ct = default);
    Task AddAsync(Profile profile, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
