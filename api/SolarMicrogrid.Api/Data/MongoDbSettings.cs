// -----------------------------------------------------------------------------
// File: MongoDbSettings.cs
// Purpose: Strongly-typed binding of the "MongoDb" section in appsettings.json
//          (connection string + database name).
// Module owner: Member D (Service Integration & Hosting)
// -----------------------------------------------------------------------------
namespace SolarMicrogrid.Api.Data;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
}
