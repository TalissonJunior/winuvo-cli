export const enumBaseResponseCodeTemplate = (projectName: string): string => {
return `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${projectName}.Business.Enums
{
    public static class BaseResponseCode
    {
        public static string INTERNAL_SERVER_ERROR = "error/internal-server-error";

        public static string UNAUTHORIZED = "auth/unauthorized";

        public static string AUTHENTICATE_BAD_REQUEST = "auth/bad-request";

        public static string AUTHENTICATE_INVALID_LOGIN = "auth/invalid-login";

        public static string AUTHENTICATE_FAIL_UPDATE = "auth/fail-to-update-user";

        public static string AUTHENTICATE_LOGIN_IN_USE = "auth/login-in-use";

        public static string AUTHENTICATE_INVALID_PASSWORD = "auth/invalid-password";

        public static string AUTHENTICATE_INVALID_TOKEN = "auth/invalid-token";

        public static string AUTHENTICATE_INVALID_REFRESH_TOKEN = "auth/invalid-refresh-token";
        
        public static string BAD_REQUEST = "bad-request";

        public static string NOT_DATA_TO_EXCLUDE = "no-data-to-exclude";
    }
}`;
};