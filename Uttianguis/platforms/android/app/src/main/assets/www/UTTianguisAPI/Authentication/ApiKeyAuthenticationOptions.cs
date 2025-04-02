using Microsoft.AspNetCore.Authentication;

namespace UTTianguisAPI.Authentication
{
    public class ApiKeyAuthenticationOptions : AuthenticationSchemeOptions
    {
        public const string DefaultScheme = "ApiKey";
        public string Scheme => DefaultScheme;
    }
}

