using BackendPortalAPI.Application.Contacts;
using Microsoft.AspNetCore.Mvc;

namespace BackendPortalAPI.Api.Controllers;

[ApiController]
public class ContactController(IContactRequestService service) : ControllerBase
{
    /// <summary>Request to reveal a profile's contact number (requester is a signed-in member).</summary>
    [HttpPost("api/profiles/{profileId:guid}/contact-requests")]
    public async Task<ActionResult<ContactRequestDto>> Request(Guid profileId, [FromBody] CreateContactRequestDto dto, CancellationToken ct)
    {
        if (dto.RequesterMemberId == Guid.Empty)
            return BadRequest("Please sign in with your membership card to request contact.");
        try
        {
            var created = await service.RequestAsync(profileId, dto.RequesterMemberId, ct);
            return created is null ? NotFound("Profile not found.") : Ok(created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>What a viewer may see of a profile's contact number.</summary>
    [HttpGet("api/profiles/{profileId:guid}/contact")]
    public async Task<ActionResult<ContactRevealDto>> Reveal(Guid profileId, [FromQuery] Guid viewerMemberId, CancellationToken ct)
    {
        if (viewerMemberId == Guid.Empty)
            return Ok(new ContactRevealDto(null, null, false));
        return Ok(await service.GetRevealAsync(profileId, viewerMemberId, ct));
    }

    /// <summary>Contact requests awaiting this member's decision (their profiles).</summary>
    [HttpGet("api/members/{memberId:guid}/contact-requests/incoming")]
    public async Task<ActionResult<IReadOnlyList<ContactRequestDto>>> Incoming(Guid memberId, CancellationToken ct) =>
        Ok(await service.ListIncomingAsync(memberId, ct));

    /// <summary>Contact requests this member has made.</summary>
    [HttpGet("api/members/{memberId:guid}/contact-requests/outgoing")]
    public async Task<ActionResult<IReadOnlyList<ContactRequestDto>>> Outgoing(Guid memberId, CancellationToken ct) =>
        Ok(await service.ListOutgoingAsync(memberId, ct));

    /// <summary>Owner approves or declines a contact request.</summary>
    [HttpPatch("api/contact-requests/{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] UpdateContactRequestStatusDto dto, CancellationToken ct)
    {
        if (dto.MemberId == Guid.Empty) return BadRequest("Member is required.");
        var ok = await service.SetStatusAsync(id, dto.MemberId, dto.Status, ct);
        // false = not found OR the caller doesn't own the request.
        return ok ? NoContent() : NotFound();
    }
}
