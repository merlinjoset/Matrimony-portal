using BackendPortalAPI.Application;
using BackendPortalAPI.Infrastructure;
using BackendPortalAPI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Local, gitignored override for secrets (e.g. the cloud DB connection string).
builder.Configuration.AddJsonFile("appsettings.Development.local.json", optional: true, reloadOnChange: false);

// ---- Services ----
builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddOpenApi();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// CORS. The API has no auth and uses no cookies/credentials, so origin restrictions
// don't protect it (direct callers ignore CORS anyway). Allow any origin to avoid the
// fragile config/env-var binding that was blocking the custom domain.
const string FrontendCors = "frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy => policy
        .SetIsOriginAllowed(_ => true)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

// ---- Auto-migrate on startup (dev convenience) ----
if (app.Configuration.GetValue("Database:AutoMigrate", true))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();

        // Import the real parish member roster (AGM eligible-members list) into TblMembers.
        var rosterPath = Path.Combine(app.Environment.ContentRootPath, "Data", "members.json");
        var (added, updated, total) = await BackendPortalAPI.Infrastructure.Persistence.MemberRosterImporter
            .ImportAsync(db, rosterPath);
        if (total > 0)
            app.Logger.LogInformation("Member roster import: {Added} added, {Updated} updated ({Total} in file).",
                added, updated, total);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Database migration failed. Is PostgreSQL running and the connection string correct?");
    }
}

// ---- Pipeline ----
// OpenAPI + Swagger UI. On by default (incl. production); set "Swagger:Enabled" = false to disable.
if (app.Configuration.GetValue("Swagger:Enabled", true))
{
    app.MapOpenApi(); // OpenAPI document at /openapi/v1.json
    // Swagger UI served at /swagger, reading the built-in OpenAPI document
    app.UseSwaggerUI(o =>
    {
        o.SwaggerEndpoint("/openapi/v1.json", "Backend Portal API v1");
        o.DocumentTitle = "Backend Portal API";
    });
}

app.UseStaticFiles(); // serves uploaded photos from wwwroot/uploads
app.UseCors(FrontendCors);
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "Backend Portal API" }));

// Friendly root so browsing the API base shows info instead of a 404
app.MapGet("/", () => Results.Ok(new
{
    service = "Backend Portal API",
    status = "running",
    endpoints = new
    {
        health = "/health",
        profiles = "/api/profiles",
        openApi = "/openapi/v1.json"
    }
}));

app.Run();
