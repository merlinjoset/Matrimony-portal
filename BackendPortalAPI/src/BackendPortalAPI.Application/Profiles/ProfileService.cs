using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Profiles;

public class ProfileService(IProfileRepository repo) : IProfileService
{
    public async Task<PagedResult<ProfileListItemDto>> BrowseAsync(ProfileQuery query, CancellationToken ct = default)
    {
        if (query.Page < 1) query.Page = 1;
        if (query.PageSize is < 1 or > 100) query.PageSize = 24;

        var (items, total) = await repo.QueryAsync(query, ct);
        return new PagedResult<ProfileListItemDto>(
            items.Select(p => p.ToListItem()).ToList(), total, query.Page, query.PageSize);
    }

    public async Task<ProfileDetailDto?> GetAsync(Guid id, CancellationToken ct = default)
    {
        var profile = await repo.GetByIdAsync(id, ct);
        return profile?.ToDetail();
    }

    public async Task<ProfileDetailDto> CreateAsync(CreateProfileDto dto, Guid? ownerMemberId = null, CancellationToken ct = default)
    {
        var entity = dto.ToEntity();
        entity.Status = ProfileStatus.Pending; // every new profile awaits parish verification
        entity.OwnerMemberId = ownerMemberId;  // the member whose card this profile was registered under
        entity.ReferenceId = await GenerateReferenceIdAsync(ct);
        await repo.AddAsync(entity, ct);
        await repo.SaveChangesAsync(ct);
        return entity.ToDetail();
    }

    public Task<bool> SetStatusAsync(Guid id, ProfileStatus status, string? note = null, CancellationToken ct = default) =>
        repo.UpdateStatusAsync(id, status, note, ct);

    public async Task<ProfileStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var counts = await repo.CountByStatusAsync(ct);
        int N(ProfileStatus s) => counts.TryGetValue(s, out var n) ? n : 0;
        return new ProfileStatsDto(
            counts.Values.Sum(),
            N(ProfileStatus.Pending),
            N(ProfileStatus.Verified),
            N(ProfileStatus.Active),
            N(ProfileStatus.Suspended));
    }

    private async Task<string> GenerateReferenceIdAsync(CancellationToken ct)
    {
        // Offset past the seeded reference ids (CSI1042–CSI1047) to avoid the unique-index collision.
        var count = await repo.CountAsync(ct);
        return $"CSI{2000 + count + 1}";
    }
}
