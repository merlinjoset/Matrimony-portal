using BackendPortalAPI.Domain.Common;

namespace BackendPortalAPI.Domain.Entities;

/// <summary>
/// A parish member from the AGM eligible-members roster (imported from the parish website).
/// Stored separately from the sample <see cref="Member"/> registry in table <c>TblAGMMembers</c>.
/// DateOfBirth and ContactNumber are not on the published roster - they are blank until the
/// parish office fills them in.
/// </summary>
public class AgmMember : AuditableEntity
{
    public string MembershipNo { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Congregation { get; set; } = "Dubai";

    /// <summary>Date of birth - not on the published roster; filled in later by the parish.</summary>
    public DateOnly? DateOfBirth { get; set; }

    /// <summary>Contact number - not on the published roster; filled in later by the parish.</summary>
    public string? ContactNumber { get; set; }

    public bool IsActive { get; set; } = true;
}
