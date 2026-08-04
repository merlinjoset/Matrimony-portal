using BackendPortalAPI.Domain.Common;

namespace BackendPortalAPI.Domain.Entities;

/// <summary>
/// A parish membership record. The real member list will be supplied by the parish later;
/// a profile can only be created against a valid, active membership number.
/// </summary>
public class Member : AuditableEntity
{
    public string MembershipNo { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Congregation { get; set; } = "Dubai";
    public bool IsActive { get; set; } = true;
}
