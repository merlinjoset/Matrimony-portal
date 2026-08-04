using BackendPortalAPI.Application.Members;
using BackendPortalAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BackendPortalAPI.Infrastructure.Persistence;

public class MemberRepository(AppDbContext db) : IMemberRepository
{
    // Validate against the real AGM roster first, then fall back to the sample members.
    public async Task<Member?> FindByCardAsync(string membershipNo, CancellationToken ct = default)
    {
        var agm = await db.AgmMembers.AsNoTracking()
            .FirstOrDefaultAsync(m => m.MembershipNo == membershipNo, ct);
        if (agm is not null) return ToMember(agm);

        return await db.Members.AsNoTracking()
            .FirstOrDefaultAsync(m => m.MembershipNo == membershipNo, ct);
    }

    public async Task<Member?> FindByIdAsync(Guid id, CancellationToken ct = default)
    {
        var member = await db.Members.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, ct);
        if (member is not null) return member;

        var agm = await db.AgmMembers.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, ct);
        return agm is null ? null : ToMember(agm);
    }

    // Surface an AGM roster row through the same Member shape the rest of the app uses.
    private static Member ToMember(AgmMember a) => new()
    {
        Id = a.Id,
        MembershipNo = a.MembershipNo,
        Name = a.Name,
        Congregation = a.Congregation,
        IsActive = a.IsActive,
    };
}
