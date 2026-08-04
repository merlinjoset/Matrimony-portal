using BackendPortalAPI.Application.Contacts;
using BackendPortalAPI.Application.Interests;
using BackendPortalAPI.Application.Members;
using BackendPortalAPI.Application.Profiles;
using BackendPortalAPI.Application.Shortlists;
using BackendPortalAPI.Application.Users;
using BackendPortalAPI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BackendPortalAPI.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("Default")
            ?? "Host=localhost;Port=5432;Database=MarriagePortal;Username=postgres;Password=postgres";

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IProfileRepository, ProfileRepository>();
        services.AddScoped<IAdminUserRepository, AdminUserRepository>();
        services.AddScoped<IInterestRepository, InterestRepository>();
        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IShortlistRepository, ShortlistRepository>();
        services.AddScoped<IContactRequestRepository, ContactRequestRepository>();
        return services;
    }
}
