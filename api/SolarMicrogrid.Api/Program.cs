// -----------------------------------------------------------------------------
// File: Program.cs
// Purpose: Application composition root — configures MongoDB, JWT
//          authentication/authorization, CORS for the web/mobile clients,
//          dependency injection for every Service, and the middleware
//          pipeline (FAT-service Web API entry point).
// Module owner: Member D (Service Integration & Hosting)
// -----------------------------------------------------------------------------
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SolarMicrogrid.Api.Common;
using SolarMicrogrid.Api.Data;
using SolarMicrogrid.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Ensure the uploads folder exists before the static-file provider initializes.
Directory.CreateDirectory(Path.Combine(builder.Environment.WebRootPath ?? Path.Combine(builder.Environment.ContentRootPath, "wwwroot"), "uploads", "prosumers"));

// Bind MongoDB and JWT settings from appsettings.json.
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// Register the Mongo context and every FAT-service business-logic service.
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<QrTokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ProsumerService>();
builder.Services.AddScoped<StationService>();
builder.Services.AddScoped<SlotService>();
builder.Services.AddScoped<ReservationService>();

// Serialize enums (UserType, SlotType, ReservationStatus, ...) as their string names, not ints.
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

// Allow the React web app (Vite dev server) and the Android emulator to call the API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApps", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().SetIsOriginAllowed(_ => true);
    });
});

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Seed the default Backoffice admin account on a fresh database.
await DbSeeder.SeedAsync(app.Services.GetRequiredService<MongoDbContext>());

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();

// Serves uploaded prosumer photos from wwwroot/uploads.
app.UseStaticFiles();

app.UseCors("ClientApps");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
