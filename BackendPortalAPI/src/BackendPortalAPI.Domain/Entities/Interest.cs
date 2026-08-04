using BackendPortalAPI.Domain.Common;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Domain.Entities;

/// <summary>
/// An expression of interest in a matrimony <see cref="Profile"/>.
/// Enquiry-based (the parish has no public member login yet): the enquirer leaves
/// their name &amp; contact, and the parish office mediates.
/// </summary>
public class Interest : AuditableEntity
{
    public Guid ToProfileId { get; set; }
    // Snapshot of the target profile for easy admin display (no join needed).
    public string ToName { get; set; } = string.Empty;
    public string ToReferenceId { get; set; } = string.Empty;

    public string FromName { get; set; } = string.Empty;
    public string FromMobile { get; set; } = string.Empty;
    public string? Message { get; set; }

    public InterestStatus Status { get; set; } = InterestStatus.Awaiting;
}
