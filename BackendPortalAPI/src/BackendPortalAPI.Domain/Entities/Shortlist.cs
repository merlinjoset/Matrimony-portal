using BackendPortalAPI.Domain.Common;

namespace BackendPortalAPI.Domain.Entities;

/// <summary>A member's saved (shortlisted) profile. Unique per (member, profile).</summary>
public class Shortlist : AuditableEntity
{
    public Guid MemberId { get; set; }
    public Guid ProfileId { get; set; }
}
