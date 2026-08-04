using BackendPortalAPI.Application.Contacts;
using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BackendPortalAPI.Infrastructure.Persistence;

public class ContactRequestRepository(AppDbContext db) : IContactRequestRepository
{
    public Task<ContactRequest?> GetAsync(Guid id, CancellationToken ct = default) =>
        db.ContactRequests.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);

    public Task<ContactRequest?> FindAsync(Guid requesterMemberId, Guid profileId, CancellationToken ct = default) =>
        db.ContactRequests.AsNoTracking()
            .FirstOrDefaultAsync(r => r.RequesterMemberId == requesterMemberId && r.ProfileId == profileId, ct);

    public async Task<IReadOnlyList<ContactRequest>> ListByOwnerAsync(Guid ownerMemberId, CancellationToken ct = default) =>
        await db.ContactRequests.AsNoTracking()
            .Where(r => r.OwnerMemberId == ownerMemberId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ContactRequest>> ListByRequesterAsync(Guid requesterMemberId, CancellationToken ct = default) =>
        await db.ContactRequests.AsNoTracking()
            .Where(r => r.RequesterMemberId == requesterMemberId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(ContactRequest request, CancellationToken ct = default) =>
        await db.ContactRequests.AddAsync(request, ct);

    public async Task<bool> UpdateStatusAsync(Guid id, Guid ownerMemberId, ContactRequestStatus status, CancellationToken ct = default)
    {
        var request = await db.ContactRequests.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (request is null) return false;
        // Only the owning member may approve/decline.
        if (request.OwnerMemberId != ownerMemberId) return false;
        request.Status = status;
        request.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
