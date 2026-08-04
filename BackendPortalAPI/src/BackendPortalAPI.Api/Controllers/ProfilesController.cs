using BackendPortalAPI.Application.Members;
using BackendPortalAPI.Application.Profiles;
using BackendPortalAPI.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace BackendPortalAPI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfilesController(IProfileService service, IMemberService members) : ControllerBase
{
    /// <summary>Browse profiles with optional filters (gender, denomination, congregation, status).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProfileListItemDto>>> Browse(
        [FromQuery] Gender? gender,
        [FromQuery] string? denomination,
        [FromQuery] string? congregation,
        [FromQuery] ProfileStatus? status,
        [FromQuery] bool live = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken ct = default)
    {
        var query = new ProfileQuery
        {
            Gender = gender,
            Denomination = denomination,
            Congregation = congregation,
            Status = status,
            Live = live,
            Page = page,
            PageSize = pageSize
        };
        return Ok(await service.BrowseAsync(query, ct));
    }

    /// <summary>Get a single profile by id.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProfileDetailDto>> Get(Guid id, CancellationToken ct)
    {
        var profile = await service.GetAsync(id, ct);
        return profile is null ? NotFound() : Ok(profile);
    }

    /// <summary>Create a new profile (submitted for parish verification).</summary>
    [HttpPost]
    public async Task<ActionResult<ProfileDetailDto>> Create([FromBody] CreateProfileDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            return BadRequest("Full name is required.");

        // Membership gate - a profile can only be created against a valid, active membership card.
        var membership = await members.ValidateAsync(dto.MembershipNo ?? string.Empty, ct);
        if (!membership.Valid)
            return BadRequest(membership.Message ?? "Invalid membership card.");

        // Link the profile to the validated member so they can later approve contact requests.
        var created = await service.CreateAsync(dto, membership.MemberId, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    /// <summary>Dashboard counts by status (admin).</summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ProfileStatsDto>> Stats(CancellationToken ct) =>
        Ok(await service.GetStatsAsync(ct));

    /// <summary>Change a profile's lifecycle status - approve / reject / suspend (admin).</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] UpdateStatusDto dto, CancellationToken ct)
    {
        var ok = await service.SetStatusAsync(id, dto.Status, dto.Note, ct);
        return ok ? NoContent() : NotFound();
    }
}
