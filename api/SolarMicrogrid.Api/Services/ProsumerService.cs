// -----------------------------------------------------------------------------
// File: ProsumerService.cs
// Purpose: Prosumer self-registration (NIC as primary key, starts
//          PendingActivation), profile lookup/edit, and self-service
//          deactivation requests from the mobile app.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
using MongoDB.Driver;
using SolarMicrogrid.Api.Common;
using SolarMicrogrid.Api.Data;
using SolarMicrogrid.Api.Dtos;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Services;

public class ProsumerService
{
    private static readonly string[] AllowedPhotoContentTypes = { "image/jpeg", "image/png", "image/webp" };
    private const long MaxPhotoSizeBytes = 5 * 1024 * 1024;

    private readonly MongoDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ProsumerService(MongoDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // Registers a new prosumer using NIC as the primary key; starts PendingActivation.
    public async Task<UserResponse> RegisterAsync(RegisterProsumerRequest request)
    {
        var exists = await _db.Users.Find(u => u.Nic == request.Nic).AnyAsync();
        if (exists)
        {
            throw new AppException("A prosumer with this NIC is already registered.");
        }

        var user = new User
        {
            UserType = UserType.Prosumer,
            Nic = request.Nic,
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Status = UserStatus.PendingActivation
        };

        await _db.Users.InsertOneAsync(user);
        return UserResponse.FromModel(user);
    }

    // Retrieves a prosumer profile by NIC.
    public async Task<UserResponse> GetByNicAsync(string nic)
    {
        var user = await FindByNicOrThrow(nic);
        return UserResponse.FromModel(user);
    }

    // Updates the prosumer's own editable profile fields.
    public async Task<UserResponse> UpdateProfileAsync(string nic, UpdateProsumerRequest request)
    {
        var user = await FindByNicOrThrow(nic);
        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Phone = request.Phone;
        user.Address = request.Address;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return UserResponse.FromModel(user);
    }

    // Uploads (or replaces) the prosumer's profile picture and returns the updated profile.
    public async Task<UserResponse> UploadPhotoAsync(string nic, IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            throw new AppException("No image file was uploaded.");
        }

        if (!AllowedPhotoContentTypes.Contains(file.ContentType))
        {
            throw new AppException("Only JPEG, PNG, or WEBP images are allowed.");
        }

        if (file.Length > MaxPhotoSizeBytes)
        {
            throw new AppException("Image must be smaller than 5 MB.");
        }

        var user = await FindByNicOrThrow(nic);

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads", "prosumers");
        Directory.CreateDirectory(uploadsDir);

        if (!string.IsNullOrEmpty(user.PhotoUrl))
        {
            var previousPath = Path.Combine(webRoot, user.PhotoUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(previousPath))
            {
                File.Delete(previousPath);
            }
        }

        var extension = file.ContentType switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg"
        };
        var fileName = $"{user.Id}-{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.PhotoUrl = $"/uploads/prosumers/{fileName}";
        user.UpdatedAt = DateTime.UtcNow;
        await _db.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return UserResponse.FromModel(user);
    }

    // Prosumer self-service: requests account deactivation immediately.
    public async Task<UserResponse> RequestDeactivationAsync(string nic)
    {
        var user = await FindByNicOrThrow(nic);
        user.Status = UserStatus.Deactivated;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return UserResponse.FromModel(user);
    }

    // Fetches a prosumer by NIC or throws a 404 AppException.
    private async Task<User> FindByNicOrThrow(string nic)
    {
        return await _db.Users.Find(u => u.Nic == nic && u.UserType == UserType.Prosumer).FirstOrDefaultAsync()
            ?? throw new AppException("Prosumer not found.", 404);
    }
}
