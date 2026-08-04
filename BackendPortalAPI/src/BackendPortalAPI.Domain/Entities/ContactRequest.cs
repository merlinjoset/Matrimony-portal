using BackendPortalAPI.Domain.Common;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Domain.Entities;

/// <summary>
/// A request from one member (the requester) to see another member's profile contact number.
/// The profile owner approves or declines; only on approval is the number revealed to the requester.
/// </summary>
public class ContactRequest : AuditableEntity
{
    /// <summary>The profile whose contact number is requested.</summary>
    public Guid ProfileId { get; set; }

    /// <summary>The member who owns the target profile and decides on this request.</summary>
    public Guid OwnerMemberId { get; set; }

    /// <summary>The member asking to see the contact number.</summary>
    public Guid RequesterMemberId { get; set; }

    // Snapshots for display without extra joins.
    public string RequesterName { get; set; } = string.Empty;
    public string? RequesterCongregation { get; set; }
    public string ProfileName { get; set; } = string.Empty;
    public string ProfileReferenceId { get; set; } = string.Empty;

    public ContactRequestStatus Status { get; set; } = ContactRequestStatus.Pending;
}
