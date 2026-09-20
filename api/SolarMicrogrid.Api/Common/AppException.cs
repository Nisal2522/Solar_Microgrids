// -----------------------------------------------------------------------------
// File: AppException.cs
// Purpose: Business-rule violation exception thrown by Services (e.g. the
//          7-day booking window rule, the 12-hour notice rule). Caught by
//          GlobalExceptionMiddleware and turned into a JSON error response.
// Module owner: Member D (Service Integration)
// -----------------------------------------------------------------------------
namespace SolarMicrogrid.Api.Common;

public class AppException : Exception
{
    public int StatusCode { get; }

    // Creates a business-rule exception with an HTTP status code (default 400).
    public AppException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}
