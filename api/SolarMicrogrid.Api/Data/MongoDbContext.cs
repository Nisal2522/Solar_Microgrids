// -----------------------------------------------------------------------------
// File: MongoDbContext.cs
// Purpose: Central access point to the MongoDB database and its four typed
//          collections. Injected as a singleton into every Service.
// Module owner: Member D (Service Integration & Hosting)
// -----------------------------------------------------------------------------
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SolarMicrogrid.Api.Models;

namespace SolarMicrogrid.Api.Data;

public class MongoDbContext
{
    // Opens the Mongo client/database using the bound MongoDbSettings.
    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);

        Users = database.GetCollection<User>("Users");
        Stations = database.GetCollection<SolarStation>("SolarStationInfo");
        BookingSlots = database.GetCollection<EnergyBookingSlot>("EnergyBookingSlots");
        Reservations = database.GetCollection<EnergyReservation>("EnergyReservation");
    }

    public IMongoCollection<User> Users { get; }
    public IMongoCollection<SolarStation> Stations { get; }
    public IMongoCollection<EnergyBookingSlot> BookingSlots { get; }
    public IMongoCollection<EnergyReservation> Reservations { get; }
}
