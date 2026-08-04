using Microsoft.AspNetCore.Mvc;

namespace BackendPortalAPI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController(IWebHostEnvironment env) : ControllerBase
{
    private static readonly string[] Allowed = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB

    /// <summary>Uploads a single image and returns its public URL.</summary>
    [HttpPost("photo")]
    [RequestSizeLimit(MaxBytes)]
    public async Task<IActionResult> UploadPhoto(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file was uploaded.");
        if (file.Length > MaxBytes)
            return BadRequest("Image is too large (max 5 MB).");
        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only image files are allowed.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(ext) || !Allowed.Contains(ext))
            ext = ".jpg";

        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var dir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(dir);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(dir, fileName);
        await using (var stream = System.IO.File.Create(fullPath))
            await file.CopyToAsync(stream, ct);

        var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
        return Ok(new { url });
    }
}
