using BackendPortalAPI.Application.Members;
using Microsoft.AspNetCore.Mvc;

namespace BackendPortalAPI.Api.Controllers;

[ApiController]
[Route("api/members")]
public class MembersController(IMemberService service) : ControllerBase
{
    /// <summary>Validate a parish membership card number before profile creation.</summary>
    [HttpGet("validate")]
    public async Task<ActionResult<MemberValidationDto>> Validate([FromQuery] string membershipNo, CancellationToken ct) =>
        Ok(await service.ValidateAsync(membershipNo, ct));
}
