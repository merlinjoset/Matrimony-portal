using BackendPortalAPI.Application.Interests;
using BackendPortalAPI.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace BackendPortalAPI.Api.Controllers;

[ApiController]
[Route("api/interests")]
public class InterestsController(IInterestService service) : ControllerBase
{
    /// <summary>Express interest in a profile (public - enquiry based).</summary>
    [HttpPost]
    public async Task<ActionResult<InterestDto>> Create([FromBody] CreateInterestDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.FromName)) return BadRequest("Your name is required.");
        if (string.IsNullOrWhiteSpace(dto.FromMobile)) return BadRequest("A contact number is required.");

        var created = await service.CreateAsync(dto, ct);
        return created is null ? NotFound("Profile not found.") : Ok(created);
    }

    /// <summary>List all interests (admin).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InterestDto>>> List(CancellationToken ct) =>
        Ok(await service.ListAsync(ct));

    /// <summary>Accept or decline an interest (admin).</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] UpdateInterestStatusDto dto, CancellationToken ct)
    {
        var ok = await service.SetStatusAsync(id, dto.Status, ct);
        return ok ? NoContent() : NotFound();
    }
}

public class UpdateInterestStatusDto
{
    public InterestStatus Status { get; set; }
}
