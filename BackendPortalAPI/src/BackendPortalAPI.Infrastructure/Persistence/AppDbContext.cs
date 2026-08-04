using BackendPortalAPI.Domain.Entities;
using BackendPortalAPI.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BackendPortalAPI.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Interest> Interests => Set<Interest>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Shortlist> Shortlists => Set<Shortlist>();
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<AgmMember> AgmMembers => Set<AgmMember>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Shortlist>(e =>
        {
            e.ToTable("TblShortlists");
            e.HasKey(s => s.Id);
            e.HasIndex(s => new { s.MemberId, s.ProfileId }).IsUnique();
            e.HasIndex(s => s.MemberId);
            e.HasQueryFilter(s => !s.IsDeleted);
        });

        b.Entity<Member>(e =>
        {
            e.ToTable("TblMembers");
            e.HasKey(m => m.Id);
            e.Property(m => m.MembershipNo).HasMaxLength(40).IsRequired();
            e.HasIndex(m => m.MembershipNo).IsUnique();
            e.Property(m => m.Name).HasMaxLength(150);
            e.Property(m => m.Congregation).HasMaxLength(80);
            e.HasQueryFilter(m => !m.IsDeleted);
        });

        b.Entity<Interest>(e =>
        {
            e.ToTable("TblInterests");
            e.HasKey(i => i.Id);
            e.Property(i => i.ToName).HasMaxLength(150);
            e.Property(i => i.ToReferenceId).HasMaxLength(20);
            e.Property(i => i.FromName).HasMaxLength(150).IsRequired();
            e.Property(i => i.FromMobile).HasMaxLength(30).IsRequired();
            e.Property(i => i.Message).HasMaxLength(1000);
            e.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(i => i.ToProfileId);
            e.HasQueryFilter(i => !i.IsDeleted);
        });

        b.Entity<AdminUser>(e =>
        {
            e.ToTable("TblUsers");
            e.HasKey(u => u.Id);
            e.Property(u => u.Name).HasMaxLength(150).IsRequired();
            e.Property(u => u.Email).HasMaxLength(200).IsRequired();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasMaxLength(50);
            e.Property(u => u.Congregation).HasMaxLength(80);
            e.Property(u => u.Status).HasConversion<string>().HasMaxLength(20);
            e.HasQueryFilter(u => !u.IsDeleted);
        });

        b.Entity<AgmMember>(e =>
        {
            e.ToTable("TblAGMMembers");
            e.HasKey(m => m.Id);
            e.Property(m => m.MembershipNo).HasMaxLength(40).IsRequired();
            e.HasIndex(m => m.MembershipNo).IsUnique();
            e.Property(m => m.Name).HasMaxLength(200).IsRequired();
            e.Property(m => m.Congregation).HasMaxLength(80);
            e.Property(m => m.ContactNumber).HasMaxLength(40);
            e.HasQueryFilter(m => !m.IsDeleted);
        });

        b.Entity<ContactRequest>(e =>
        {
            e.ToTable("TblContactRequests");
            e.HasKey(r => r.Id);
            // One standing request per (requester, profile) pair.
            e.HasIndex(r => new { r.RequesterMemberId, r.ProfileId }).IsUnique();
            e.HasIndex(r => r.OwnerMemberId);
            e.Property(r => r.RequesterName).HasMaxLength(150).IsRequired();
            e.Property(r => r.RequesterCongregation).HasMaxLength(80);
            e.Property(r => r.ProfileName).HasMaxLength(150).IsRequired();
            e.Property(r => r.ProfileReferenceId).HasMaxLength(20);
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.HasQueryFilter(r => !r.IsDeleted);
        });

        b.Entity<Profile>(e =>
        {
            e.ToTable("TblProfiles");
            e.HasKey(p => p.Id);
            e.Ignore(p => p.Age); // computed, not stored
            e.HasIndex(p => p.OwnerMemberId);
            e.Property(p => p.ReferenceId).HasMaxLength(20).IsRequired();
            e.HasIndex(p => p.ReferenceId).IsUnique();
            e.Property(p => p.FullName).HasMaxLength(150).IsRequired();
            e.Property(p => p.Mobile).HasMaxLength(30);
            e.Property(p => p.HomeParish).HasMaxLength(200);
            e.Property(p => p.Congregation).HasMaxLength(80);
            e.Property(p => p.Denomination).HasMaxLength(80);
            e.Property(p => p.MainPhotoUrl).HasMaxLength(2048);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.StatusNote).HasMaxLength(500);
            e.Property(p => p.Gender).HasConversion<string>().HasMaxLength(10);
            e.HasQueryFilter(p => !p.IsDeleted);
        });

        Seed(b);
    }

    /// <summary>A handful of illustrative, faith-centred sample profiles (no caste data).</summary>
    private static void Seed(ModelBuilder b)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        (string id, string name, Gender g, int year, string h, string denom, string cong, string parish, string edu, string job, string city, ProfileStatus st)[] rows =
        [
            ("11111111-1111-1111-1111-111111111101","Abinaya R.",Gender.Female,2000,"5'4\"","CSI","Dubai","CSI Tamil Parish, Dubai","Master's (M.Sc Nursing)","Staff Nurse","Dubai, UAE",ProfileStatus.Verified),
            ("11111111-1111-1111-1111-111111111102","Daniel J.",Gender.Male,1997,"5'10\"","CSI","Fujairah","CSI Tamil Congregation, Fujairah","Bachelor's (B.E)","Software Engineer","Fujairah, UAE",ProfileStatus.Verified),
            ("11111111-1111-1111-1111-111111111103","Sharon P.",Gender.Female,2002,"5'2\"","Pentecostal","Dubai","Bethel AG Church, Dubai","Bachelor's (B.Com)","Accountant","Dubai, UAE",ProfileStatus.Active),
            ("11111111-1111-1111-1111-111111111104","Immanuel S.",Gender.Male,1995,"6'0\"","CSI","Ras Al Khaimah","CSI Tamil Congregation, Ras Al Khaimah","Doctorate (PhD)","College Lecturer","Ras Al Khaimah, UAE",ProfileStatus.Verified),
            ("11111111-1111-1111-1111-111111111105","Rebecca A.",Gender.Female,1998,"5'5\"","CSI","Other","CSI Tamil Fellowship, London","Master's (M.A)","School Teacher","London, UK",ProfileStatus.Active),
            ("11111111-1111-1111-1111-111111111106","Joel V.",Gender.Male,1999,"5'8\"","Lutheran","India","TELC Church, Chennai","Bachelor's (B.Sc)","Lab Technician","Chennai, India",ProfileStatus.Pending),
        ];

        // Link each seed profile to one of the active seed members so contact-reveal
        // approval is demoable (e.g. signing in as CSI-DXB-1001 owns Abinaya & Rebecca).
        Guid[] ownerIds =
        [
            Guid.Parse("33333333-3333-3333-3333-333333333301"),
            Guid.Parse("33333333-3333-3333-3333-333333333302"),
            Guid.Parse("33333333-3333-3333-3333-333333333303"),
            Guid.Parse("33333333-3333-3333-3333-333333333304"),
        ];

        var seeds = rows.Select((r, i) => new Profile
        {
            Id = Guid.Parse(r.id),
            ReferenceId = $"CSI{1042 + i}",
            OwnerMemberId = ownerIds[i % ownerIds.Length],
            CreatedFor = "Self",
            LookingFor = r.g == Gender.Female ? "Groom" : "Bride",
            Mobile = "+971 50 000 0000",
            FullName = r.name,
            Gender = r.g,
            DateOfBirth = new DateOnly(r.year, 6, 15),
            Height = r.h,
            MaritalStatus = "Never married",
            MotherTongue = "Tamil",
            Denomination = r.denom,
            HomeParish = r.parish,
            Congregation = r.cong,
            AboutFaith = "Active in church fellowship and ministry.",
            Education = r.edu,
            Profession = r.job,
            City = r.city,
            Status = r.st,
            CreatedAt = seedDate
        }).ToArray();

        b.Entity<Profile>().HasData(seeds);

        var userSeedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        b.Entity<AdminUser>().HasData(
            new AdminUser { Id = Guid.Parse("22222222-2222-2222-2222-222222222201"), Name = "Rev. Benjamin", Email = "benjamin@csitamilparishdubai.com", Role = "Diocese Admin", Congregation = "Dubai (Main)", Status = AdminUserStatus.Active, CreatedAt = userSeedDate },
            new AdminUser { Id = Guid.Parse("22222222-2222-2222-2222-222222222202"), Name = "Rev. S. Daniel", Email = "presbyter@csitamilparishdubai.com", Role = "Parish Presbyter", Congregation = "Dubai (Main)", Status = AdminUserStatus.Active, CreatedAt = userSeedDate },
            new AdminUser { Id = Guid.Parse("22222222-2222-2222-2222-222222222203"), Name = "Sis. Mary J.", Email = "moderator@csitamilparishdubai.com", Role = "Moderator", Congregation = "Fujairah", Status = AdminUserStatus.Active, CreatedAt = userSeedDate },
            new AdminUser { Id = Guid.Parse("22222222-2222-2222-2222-222222222204"), Name = "Office Desk", Email = "office@csitamilparishdubai.com", Role = "Office Staff", Congregation = "Dubai (Main)", Status = AdminUserStatus.Invited, CreatedAt = userSeedDate }
        );

        // Sample membership registry - to be REPLACED with the parish's real member list later.
        b.Entity<Member>().HasData(
            new Member { Id = Guid.Parse("33333333-3333-3333-3333-333333333301"), MembershipNo = "CSI-DXB-1001", Name = "Mr. & Mrs. Rajesh Daniel", Congregation = "Dubai", IsActive = true, CreatedAt = userSeedDate },
            new Member { Id = Guid.Parse("33333333-3333-3333-3333-333333333302"), MembershipNo = "CSI-DXB-1002", Name = "Mr. & Mrs. Samuel John", Congregation = "Dubai", IsActive = true, CreatedAt = userSeedDate },
            new Member { Id = Guid.Parse("33333333-3333-3333-3333-333333333303"), MembershipNo = "CSI-FUJ-2001", Name = "Mr. & Mrs. Christopher", Congregation = "Fujairah", IsActive = true, CreatedAt = userSeedDate },
            new Member { Id = Guid.Parse("33333333-3333-3333-3333-333333333304"), MembershipNo = "CSI-RAK-3001", Name = "Mr. & Mrs. Wilson", Congregation = "Ras Al Khaimah", IsActive = true, CreatedAt = userSeedDate },
            new Member { Id = Guid.Parse("33333333-3333-3333-3333-333333333305"), MembershipNo = "CSI-DXB-9999", Name = "Lapsed Membership", Congregation = "Dubai", IsActive = false, CreatedAt = userSeedDate }
        );
    }
}
