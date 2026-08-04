using BackendPortalAPI.Application.Users;
using BackendPortalAPI.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace BackendPortalAPI.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
public class AdminUsersController(IAdminUserService service) : ControllerBase
{
    /// <summary>List all staff/admin users.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminUserDto>>> List(CancellationToken ct) =>
        Ok(await service.ListAsync(ct));

    /// <summary>Create (invite) a new staff/admin user.</summary>
    [HttpPost]
    public async Task<ActionResult<AdminUserDto>> Create([FromBody] CreateAdminUserDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name is required.");
        if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains('@')) return BadRequest("A valid email is required.");

        var created = await service.CreateAsync(dto, ct);
        if (created is null) return Conflict("A user with that email already exists.");
        return CreatedAtAction(nameof(List), new { id = created.Id }, created);
    }

    /// <summary>Change a user's status (activate / disable).</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] UpdateUserStatusDto dto, CancellationToken ct)
    {
        var ok = await service.SetStatusAsync(id, dto.Status, ct);
        return ok ? NoContent() : NotFound();
    }
}

public class UpdateUserStatusDto
{
    public AdminUserStatus Status { get; set; }
}
