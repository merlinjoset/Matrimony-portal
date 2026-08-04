using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Interests;

public record InterestDto(
    Guid Id,
    Guid ToProfileId,
    string ToName,
    string ToReferenceId,
    string FromName,
    string FromMobile,
    string? Message,
    InterestStatus Status,
    DateTime CreatedAt);

public class CreateInterestDto
{
    public Guid ToProfileId { get; set; }
    public string FromName { get; set; } = string.Empty;
    public string FromMobile { get; set; } = string.Empty;
    public string? Message { get; set; }
}

public interface IInterestRepository
{
    Task<IReadOnlyList<Interest>> ListAsync(CancellationToken ct = default);
    Task AddAsync(Interest interest, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(Guid id, InterestStatus status, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

public interface IInterestService
{
    /// <summary>Creates an interest. Returns null if the target profile does not exist.</summary>
    Task<InterestDto?> CreateAsync(CreateInterestDto dto, CancellationToken ct = default);
    Task<IReadOnlyList<InterestDto>> ListAsync(CancellationToken ct = default);
    Task<bool> SetStatusAsync(Guid id, InterestStatus status, CancellationToken ct = default);
}

internal static class InterestMappings
{
    public static InterestDto ToDto(this Interest i) =>
        new(i.Id, i.ToProfileId, i.ToName, i.ToReferenceId, i.FromName, i.FromMobile, i.Message, i.Status, i.CreatedAt);
}
