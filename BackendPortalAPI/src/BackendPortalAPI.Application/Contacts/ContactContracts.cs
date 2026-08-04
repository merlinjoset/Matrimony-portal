using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Contacts;

/// <summary>A contact-reveal request, shaped for both the owner's queue and the requester's list.</summary>
public record ContactRequestDto(
    Guid Id,
    Guid ProfileId,
    string ProfileName,
    string ProfileReferenceId,
    Guid RequesterMemberId,
    string RequesterName,
    string? RequesterCongregation,
    ContactRequestStatus Status,
    DateTime CreatedAt);

/// <summary>
/// What a viewer is allowed to see for a profile's contact number.
/// <see cref="Status"/> is null when the viewer has not requested yet.
/// <see cref="Mobile"/> is populated only when the viewer owns the profile or the request is approved.
/// </summary>
public record ContactRevealDto(ContactRequestStatus? Status, string? Mobile, bool IsOwner);

public class CreateContactRequestDto
{
    public Guid RequesterMemberId { get; set; }
}

public class UpdateContactRequestStatusDto
{
    /// <summary>The owner member acting on the request (authorises the change).</summary>
    public Guid MemberId { get; set; }
    public ContactRequestStatus Status { get; set; }
}

public interface IContactRequestRepository
{
    Task<ContactRequest?> GetAsync(Guid id, CancellationToken ct = default);
    Task<ContactRequest?> FindAsync(Guid requesterMemberId, Guid profileId, CancellationToken ct = default);
    Task<IReadOnlyList<ContactRequest>> ListByOwnerAsync(Guid ownerMemberId, CancellationToken ct = default);
    Task<IReadOnlyList<ContactRequest>> ListByRequesterAsync(Guid requesterMemberId, CancellationToken ct = default);
    Task AddAsync(ContactRequest request, CancellationToken ct = default);
    Task<bool> UpdateStatusAsync(Guid id, Guid ownerMemberId, ContactRequestStatus status, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}

public interface IContactRequestService
{
    /// <summary>Create (or return the existing) request to reveal a profile's contact number.</summary>
    Task<ContactRequestDto?> RequestAsync(Guid profileId, Guid requesterMemberId, CancellationToken ct = default);

    /// <summary>Requests awaiting a given owner's decision (their profiles), newest first.</summary>
    Task<IReadOnlyList<ContactRequestDto>> ListIncomingAsync(Guid ownerMemberId, CancellationToken ct = default);

    /// <summary>Requests a given member has made, newest first.</summary>
    Task<IReadOnlyList<ContactRequestDto>> ListOutgoingAsync(Guid requesterMemberId, CancellationToken ct = default);

    /// <summary>Owner approves or declines a request. Only the owning member may act.</summary>
    Task<bool> SetStatusAsync(Guid id, Guid ownerMemberId, ContactRequestStatus status, CancellationToken ct = default);

    /// <summary>What a viewer may see of a profile's contact number.</summary>
    Task<ContactRevealDto> GetRevealAsync(Guid profileId, Guid viewerMemberId, CancellationToken ct = default);
}
