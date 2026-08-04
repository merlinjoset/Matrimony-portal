using BackendPortalAPI.Domain.Common;
using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Domain.Entities;

/// <summary>
/// A matrimony profile for the CSI Tamil Parish community.
/// Faith-centred fields only - no caste/community is ever stored.
/// </summary>
public class Profile : AuditableEntity
{
    /// <summary>Human-friendly reference shown in the UI, e.g. "CSI1042".</summary>
    public string ReferenceId { get; set; } = string.Empty;

    /// <summary>Parish membership card number this profile was registered against.</summary>
    public string? MembershipNo { get; set; }

    /// <summary>
    /// The member who owns this profile (the card it was registered under).
    /// This member approves requests to reveal the contact number. Null for legacy/seed
    /// profiles created before owner linking.
    /// </summary>
    public Guid? OwnerMemberId { get; set; }

    // Who created the profile and what they seek
    public string CreatedFor { get; set; } = "Self";   // Self / Son / Daughter / Ward
    public string LookingFor { get; set; } = "Bride";  // Bride / Groom
    public string Mobile { get; set; } = string.Empty;

    // Personal
    public string FullName { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Height { get; set; }
    public string MaritalStatus { get; set; } = "Never married";
    public string MotherTongue { get; set; } = "Tamil";

    // Faith & church
    public string Denomination { get; set; } = "CSI";
    public string HomeParish { get; set; } = string.Empty;
    public string Congregation { get; set; } = "Dubai"; // Dubai / Fujairah / Ras Al Khaimah / India / Other
    public string? AboutFaith { get; set; }

    // Education & profession
    public string? Education { get; set; }
    public string? Profession { get; set; }
    public string? City { get; set; }

    // Family (optional)
    public string? FatherOccupation { get; set; }
    public string? MotherOccupation { get; set; }

    // Photos - main photo for now; a gallery table can be added later
    public string? MainPhotoUrl { get; set; }

    public ProfileStatus Status { get; set; } = ProfileStatus.Pending;

    /// <summary>Note attached to the last status change - e.g. the reason a profile was rejected.</summary>
    public string? StatusNote { get; set; }

    /// <summary>Age derived from <see cref="DateOfBirth"/>; not stored.</summary>
    public int? Age
    {
        get
        {
            if (DateOfBirth is null) return null;
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var age = today.Year - DateOfBirth.Value.Year;
            if (DateOfBirth.Value > today.AddYears(-age)) age--;
            return age >= 0 ? age : null;
        }
    }
}
