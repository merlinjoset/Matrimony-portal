namespace BackendPortalAPI.Domain.Enums;

public enum Gender
{
    Female = 0,
    Male = 1
}

/// <summary>Lifecycle of a matrimony profile, mirroring the parish verification workflow.</summary>
public enum ProfileStatus
{
    Pending = 0,    // submitted, awaiting parish verification
    Verified = 1,   // approved by a presbyter / parish office
    Active = 2,     // live and searchable
    Suspended = 3,  // hidden by an admin
    Rejected = 4    // not approved - sent back with a reason
}

/// <summary>Lifecycle of an admin/staff account.</summary>
public enum AdminUserStatus
{
    Invited = 0,    // account created, not yet signed in
    Active = 1,     // active staff account
    Disabled = 2    // access revoked
}

/// <summary>Lifecycle of an expression of interest.</summary>
public enum InterestStatus
{
    Awaiting = 0,   // sent, awaiting a response
    Accepted = 1,   // accepted - contact may be shared
    Declined = 2    // declined
}

/// <summary>Lifecycle of a request to reveal a profile's contact number.</summary>
public enum ContactRequestStatus
{
    Pending = 0,    // requested, awaiting the profile owner's decision
    Approved = 1,   // owner approved - the requester may see the number
    Declined = 2    // owner declined
}
