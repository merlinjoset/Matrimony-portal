using BackendPortalAPI.Domain.Entities;

namespace BackendPortalAPI.Application.Members;

public record MemberValidationDto(bool Valid, Guid? MemberId, string? Name, string? Congregation, string? Message);

public interface IMemberRepository
{
    Task<Member?> FindByCardAsync(string membershipNo, CancellationToken ct = default);
    Task<Member?> FindByIdAsync(Guid id, CancellationToken ct = default);
}

public interface IMemberService
{
    Task<MemberValidationDto> ValidateAsync(string membershipNo, CancellationToken ct = default);
}

public class MemberService(IMemberRepository repo) : IMemberService
{
    public async Task<MemberValidationDto> ValidateAsync(string membershipNo, CancellationToken ct = default)
    {
        var card = (membershipNo ?? string.Empty).Trim();
        if (card.Length == 0)
            return new MemberValidationDto(false, null, null, null, "Please enter your membership card number.");

        var member = await repo.FindByCardAsync(card, ct);
        if (member is null)
            return new MemberValidationDto(false, null, null, null, "Membership number not found. Please contact the parish office.");
        if (!member.IsActive)
            return new MemberValidationDto(false, null, null, null, "This membership is inactive. Please contact the parish office.");

        return new MemberValidationDto(true, member.Id, member.Name, member.Congregation, null);
    }
}
