using BackendPortalAPI.Domain.Enums;

namespace BackendPortalAPI.Application.Profiles;

/// <summary>Compact shape for the browse/list grid.</summary>
public record ProfileListItemDto(
    Guid Id,
    string ReferenceId,
    string FullName,
    Gender Gender,
    int? Age,
    string? Height,
    string Denomination,
    string Congregation,
    string? Education,
    string? Profession,
    string? City,
    string? MainPhotoUrl,
    ProfileStatus Status);

/// <summary>Full shape for a profile detail page.</summary>
public record ProfileDetailDto(
    Guid Id,
    string ReferenceId,
    string CreatedFor,
    string LookingFor,
    string FullName,
    Gender Gender,
    int? Age,
    string? Height,
    string MaritalStatus,
    string MotherTongue,
    string Denomination,
    string HomeParish,
    string Congregation,
    string? AboutFaith,
    string? Education,
    string? Profession,
    string? City,
    string? FatherOccupation,
    string? MotherOccupation,
    string? MainPhotoUrl,
    ProfileStatus Status,
    string? StatusNote,
    DateTime CreatedAt);

/// <summary>Payload to create a new profile from the public register form.</summary>
public class CreateProfileDto
{
    public string? MembershipNo { get; set; }
    public string CreatedFor { get; set; } = "Self";
    public string LookingFor { get; set; } = "Bride";
    public string Mobile { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Height { get; set; }
    public string MaritalStatus { get; set; } = "Never married";
    public string MotherTongue { get; set; } = "Tamil";
    public string Denomination { get; set; } = "CSI";
    public string HomeParish { get; set; } = string.Empty;
    public string Congregation { get; set; } = "Dubai";
    public string? AboutFaith { get; set; }
    public string? Education { get; set; }
    public string? Profession { get; set; }
    public string? City { get; set; }
    public string? FatherOccupation { get; set; }
    public string? MotherOccupation { get; set; }
    public string? MainPhotoUrl { get; set; }
}

/// <summary>Filters for the browse grid.</summary>
public class ProfileQuery
{
    public Gender? Gender { get; set; }
    public string? Denomination { get; set; }
    public string? Congregation { get; set; }
    public ProfileStatus? Status { get; set; }
    /// <summary>When true, return only publicly visible profiles (Verified or Active).</summary>
    public bool Live { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 24;
}

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);

/// <summary>Dashboard counts by status.</summary>
public record ProfileStatsDto(int Total, int Pending, int Verified, int Active, int Suspended);

/// <summary>Body for changing a profile's lifecycle status (admin).</summary>
public class UpdateStatusDto
{
    public ProfileStatus Status { get; set; }
    /// <summary>Optional note (e.g. the reason when rejecting).</summary>
    public string? Note { get; set; }
}
