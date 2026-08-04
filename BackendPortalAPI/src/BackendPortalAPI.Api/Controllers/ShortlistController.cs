using BackendPortalAPI.Application.Profiles;
using BackendPortalAPI.Application.Shortlists;
using Microsoft.AspNetCore.Mvc;

namespace BackendPortalAPI.Api.Controllers;

[ApiController]
[Route("api/members/{memberId:guid}/shortlist")]
public class ShortlistController(IShortlistService service) : ControllerBase
{
    /// <summary>List the member's shortlisted profiles (most recent first).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProfileListItemDto>>> List(Guid memberId, CancellationToken ct) =>
        Ok(await service.ListAsync(memberId, ct));

    /// <summary>Add a profile to the member's shortlist (idempotent).</summary>
    [HttpPost]
    public async Task<IActionResult> Add(Guid memberId, [FromBody] ShortlistAddDto dto, CancellationToken ct)
    {
        await service.AddAsync(memberId, dto.ProfileId, ct);
        return NoContent();
    }

    /// <summary>Remove a profile from the member's shortlist.</summary>
    [HttpDelete("{profileId:guid}")]
    public async Task<IActionResult> Remove(Guid memberId, Guid profileId, CancellationToken ct)
    {
        var ok = await service.RemoveAsync(memberId, profileId, ct);
        return ok ? NoContent() : NotFound();
    }
}

public class ShortlistAddDto
{
    public Guid ProfileId { get; set; }
}
