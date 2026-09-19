// -----------------------------------------------------------------------------
// File: DbSeeder.cs
// Purpose: Ensures a first Backoffice administrator account exists on
//          startup, so the system is reachable before any manual data
//          entry — required to bootstrap login on a fresh MongoDB database.
// Module owner: Member D (Service Integration & Hosting)
// -----------------------------------------------------------------------------
using MongoDB.Driver;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Data;

public static class DbSeeder
{
    // Inserts a default "admin" Backoffice account if the Users collection is empty.
    public static async Task SeedAsync(MongoDbContext db)
    {
        var hasAnyUser = await db.Users.Find(_ => true).AnyAsync();
        if (hasAnyUser) return;

        var admin = new User
        {
            UserType = UserType.Backoffice,
            FullName = "System Administrator",
            Email = "admin@solarmicrogrid.local",
            Phone = "0000000000",
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Status = UserStatus.Active,
            CreatedBy = "system-seed"
        };

        await db.Users.InsertOneAsync(admin);
    }
}
