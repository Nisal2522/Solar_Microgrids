// -----------------------------------------------------------------------------
// File: GlobalExceptionMiddleware.cs
// Purpose: Converts AppException (business-rule violations) and unexpected
//          errors into consistent JSON error responses, so every Service
//          can simply throw instead of building HTTP responses by hand.
// Module owner: Member D (Service Integration)
// -----------------------------------------------------------------------------
using System.Text.Json;

namespace SolarMicrogrid.Api.Common;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    // Invokes the next middleware, catching AppException/unhandled errors into JSON.
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = ex.StatusCode;
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = ex.Message }));
        }
        catch (FormatException)
        {
            // Thrown by the Mongo driver when an id route/query parameter isn't a valid ObjectId.
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = 400;
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = "Invalid identifier format." }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = "An unexpected error occurred." }));
        }
    }
}
