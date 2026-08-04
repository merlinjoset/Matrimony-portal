using BackendPortalAPI.Application.Profiles;
using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Interests;

public class InterestService(IInterestRepository repo, IProfileRepository profiles) : IInterestService
{
    public async Task<InterestDto?> CreateAsync(CreateInterestDto dto, CancellationToken ct = default)
    {
        var target = await profiles.GetByIdAsync(dto.ToProfileId, ct);
        if (target is null) return null;

        var interest = new Interest
        {
            ToProfileId = target.Id,
            ToName = target.FullName,
            ToReferenceId = target.ReferenceId,
            FromName = dto.FromName.Trim(),
            FromMobile = dto.FromMobile.Trim(),
            Message = string.IsNullOrWhiteSpace(dto.Message) ? null : dto.Message.Trim(),
            Status = InterestStatus.Awaiting,
        };
        await repo.AddAsync(interest, ct);
        await repo.SaveChangesAsync(ct);
        return interest.ToDto();
    }

    public async Task<IReadOnlyList<InterestDto>> ListAsync(CancellationToken ct = default)
    {
        var list = await repo.ListAsync(ct);
        return list.Select(i => i.ToDto()).ToList();
    }

    public Task<bool> SetStatusAsync(Guid id, InterestStatus status, CancellationToken ct = default) =>
        repo.UpdateStatusAsync(id, status, ct);
}
