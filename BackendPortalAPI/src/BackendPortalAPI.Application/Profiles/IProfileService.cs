using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Profiles;

public interface IProfileService
{
    Task<PagedResult<ProfileListItemDto>> BrowseAsync(ProfileQuery query, CancellationToken ct = default);
    Task<ProfileDetailDto?> GetAsync(Guid id, CancellationToken ct = default);
    Task<ProfileDetailDto> CreateAsync(CreateProfileDto dto, Guid? ownerMemberId = null, CancellationToken ct = default);
    Task<bool> SetStatusAsync(Guid id, ProfileStatus status, string? note = null, CancellationToken ct = default);
    Task<ProfileStatsDto> GetStatsAsync(CancellationToken ct = default);
}
