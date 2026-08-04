using System.Globalization;
using System.Text.Json;
using BackendPortalAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BackendPortalAPI.Infrastructure.Persistence;

/// <summary>
/// Imports the parish AGM eligible-members roster (Data/members.json, scraped from the parish
/// website) into <c>TblAGMMembers</c> on startup. Idempotent: inserts members not already present
/// and refreshes name/congregation/DOB/contact for existing ones.
/// </summary>
public static class MemberRosterImporter
{
    private sealed record Row(string MembershipNo, string Name, string Congregation, string? DateOfBirth, string? ContactNumber);

    public static async Task<(int Added, int Updated, int Total)> ImportAsync(
        AppDbContext db, string filePath, CancellationToken ct = default)
    {
        if (!File.Exists(filePath)) return (0, 0, 0);

        await using var stream = File.OpenRead(filePath);
        var rows = await JsonSerializer.DeserializeAsync<List<Row>>(stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct) ?? [];

        // Collapse to the latest entry per card and drop blanks.
        var roster = rows
            .Where(r => !string.IsNullOrWhiteSpace(r.MembershipNo) && !string.IsNullOrWhiteSpace(r.Name))
            .GroupBy(r => r.MembershipNo.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => g.Last())
            .ToList();
        if (roster.Count == 0) return (0, 0, 0);

        var existing = await db.AgmMembers.ToDictionaryAsync(m => m.MembershipNo, StringComparer.OrdinalIgnoreCase, ct);

        int added = 0, updated = 0;
        foreach (var r in roster)
        {
            var card = r.MembershipNo.Trim();
            var name = r.Name.Trim();
            var congregation = NormalizeCongregation(r.Congregation);
            var dob = ParseDate(r.DateOfBirth);
            var contact = string.IsNullOrWhiteSpace(r.ContactNumber) ? null : r.ContactNumber.Trim();

            if (existing.TryGetValue(card, out var member))
            {
                if (member.Name != name || member.Congregation != congregation
                    || member.DateOfBirth != dob || member.ContactNumber != contact)
                {
                    member.Name = name;
                    member.Congregation = congregation;
                    member.DateOfBirth = dob;
                    member.ContactNumber = contact;
                    member.UpdatedAt = DateTime.UtcNow;
                    updated++;
                }
            }
            else
            {
                db.AgmMembers.Add(new AgmMember
                {
                    MembershipNo = card,
                    Name = name,
                    Congregation = congregation,
                    DateOfBirth = dob,
                    ContactNumber = contact,
                    IsActive = true,
                });
                added++;
            }
        }

        if (added > 0 || updated > 0) await db.SaveChangesAsync(ct);
        return (added, updated, roster.Count);
    }

    private static DateOnly? ParseDate(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        string[] formats = ["yyyy-MM-dd", "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy"];
        return DateOnly.TryParseExact(raw.Trim(), formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)
            ? d
            : DateOnly.TryParse(raw.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var d2) ? d2 : null;
    }

    private static string NormalizeCongregation(string? raw)
    {
        var c = (raw ?? string.Empty).Trim();
        return c.ToUpperInvariant() switch
        {
            "RAK" => "Ras Al Khaimah",
            "" => "Dubai",
            _ => c,
        };
    }
}
