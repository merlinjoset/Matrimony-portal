using BackendPortalAPI.Domain.Entities;

namespace BackendPortalAPI.Application.Profiles;

/// <summary>Manual mapping between Profile entity and its DTOs.</summary>
internal static class ProfileMappings
{
    public static ProfileListItemDto ToListItem(this Profile p) => new(
        p.Id, p.ReferenceId, p.FullName, p.Gender, p.Age, p.Height,
        p.Denomination, p.Congregation, p.Education, p.Profession, p.City,
        p.MainPhotoUrl, p.Status);

    public static ProfileDetailDto ToDetail(this Profile p) => new(
        p.Id, p.ReferenceId, p.CreatedFor, p.LookingFor, p.FullName, p.Gender, p.Age,
        p.Height, p.MaritalStatus, p.MotherTongue, p.Denomination, p.HomeParish,
        p.Congregation, p.AboutFaith, p.Education, p.Profession, p.City,
        p.FatherOccupation, p.MotherOccupation, p.MainPhotoUrl, p.Status, p.StatusNote, p.CreatedAt);

    public static Profile ToEntity(this CreateProfileDto d) => new()
    {
        MembershipNo = string.IsNullOrWhiteSpace(d.MembershipNo) ? null : d.MembershipNo.Trim(),
        CreatedFor = d.CreatedFor,
        LookingFor = d.LookingFor,
        Mobile = d.Mobile,
        FullName = d.FullName,
        Gender = d.Gender,
        DateOfBirth = d.DateOfBirth,
        Height = d.Height,
        MaritalStatus = d.MaritalStatus,
        MotherTongue = d.MotherTongue,
        Denomination = d.Denomination,
        HomeParish = d.HomeParish,
        Congregation = d.Congregation,
        AboutFaith = d.AboutFaith,
        Education = d.Education,
        Profession = d.Profession,
        City = d.City,
        FatherOccupation = d.FatherOccupation,
        MotherOccupation = d.MotherOccupation,
        MainPhotoUrl = d.MainPhotoUrl
    };
}
