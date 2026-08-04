using BackendPortalAPI.Application.Members;
using BackendPortalAPI.Application.Profiles;
using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Contacts;

public class ContactRequestService(
    IContactRequestRepository repo,
    IProfileRepository profiles,
    IMemberRepository members) : IContactRequestService
{
    public async Task<ContactRequestDto?> RequestAsync(Guid profileId, Guid requesterMemberId, CancellationToken ct = default)
    {
        var profile = await profiles.GetByIdAsync(profileId, ct);
        if (profile is null) return null;

        // A profile without a linked owner can't have its contact approved by anyone.
        if (profile.OwnerMemberId is null)
            throw new InvalidOperationException("This profile is not yet linked to a member account, so contact cannot be requested.");

        // No point requesting your own number.
        if (profile.OwnerMemberId == requesterMemberId)
            throw new InvalidOperationException("This is your own profile.");

        var requester = await members.FindByIdAsync(requesterMemberId, ct)
            ?? throw new InvalidOperationException("Requesting member not found.");

        // Idempotent - return the existing request if one is already on file.
        var existing = await repo.FindAsync(requesterMemberId, profileId, ct);
        if (existing is not null) return Map(existing);

        var request = new ContactRequest
        {
            ProfileId = profile.Id,
            OwnerMemberId = profile.OwnerMemberId.Value,
            RequesterMemberId = requesterMemberId,
            RequesterName = requester.Name,
            RequesterCongregation = requester.Congregation,
            ProfileName = profile.FullName,
            ProfileReferenceId = profile.ReferenceId,
            Status = ContactRequestStatus.Pending,
        };
        await repo.AddAsync(request, ct);
        await repo.SaveChangesAsync(ct);
        return Map(request);
    }

    public async Task<IReadOnlyList<ContactRequestDto>> ListIncomingAsync(Guid ownerMemberId, CancellationToken ct = default) =>
        (await repo.ListByOwnerAsync(ownerMemberId, ct)).Select(Map).ToList();

    public async Task<IReadOnlyList<ContactRequestDto>> ListOutgoingAsync(Guid requesterMemberId, CancellationToken ct = default) =>
        (await repo.ListByRequesterAsync(requesterMemberId, ct)).Select(Map).ToList();

    public Task<bool> SetStatusAsync(Guid id, Guid ownerMemberId, ContactRequestStatus status, CancellationToken ct = default) =>
        repo.UpdateStatusAsync(id, ownerMemberId, status, ct);

    public async Task<ContactRevealDto> GetRevealAsync(Guid profileId, Guid viewerMemberId, CancellationToken ct = default)
    {
        var profile = await profiles.GetByIdAsync(profileId, ct);
        if (profile is null) return new ContactRevealDto(null, null, false);

        // The owner always sees their own profile's number.
        if (profile.OwnerMemberId is not null && profile.OwnerMemberId == viewerMemberId)
            return new ContactRevealDto(ContactRequestStatus.Approved, profile.Mobile, IsOwner: true);

        var request = await repo.FindAsync(viewerMemberId, profileId, ct);
        if (request is null) return new ContactRevealDto(null, null, false);

        var mobile = request.Status == ContactRequestStatus.Approved ? profile.Mobile : null;
        return new ContactRevealDto(request.Status, mobile, IsOwner: false);
    }

    private static ContactRequestDto Map(ContactRequest r) => new(
        r.Id, r.ProfileId, r.ProfileName, r.ProfileReferenceId,
        r.RequesterMemberId, r.RequesterName, r.RequesterCongregation, r.Status, r.CreatedAt);
}
