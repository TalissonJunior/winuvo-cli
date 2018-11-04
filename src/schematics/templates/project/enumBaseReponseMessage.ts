export const enumBaseResponseMessageTemplate = (projectName: string): string => {
return `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${projectName}.Business.Enums
{
    public static class BaseResponseMessage
    {
        public static string USER_NOT_FOUND = "There is no user record corresponding to this data. The user may have been deleted.";

        public static string WRONG_PASSWORD = "WRONG PASSWORD";

        public static string INVALID_TOKEN = "INVALID TOKEN";
        
        public static string INVALID_REFRESH_TOKEN = "Invalid refresh token.";

        public static string AUTHENTICATE_FAIL_UPDATE = "AUTHENTICATE FAIL UPDATE";

        public static string INVALID_ID = "You must provide a valid 'id' property value";

        public static string BAD_REQUEST = "BAD REQUEST";

        public static string NOT_DATA_TO_EXCLUDE = "No data to be excluded";

        public static string INVALID_TOKEN_AND_REFRESH_TOKEN = "You must provide a 'token' and 'refreshToken' property";

        public static string INVALID_PASSWORD_TOKEN = "You must provide a 'password' and 'token' property";

        public static string INVALID_EMAIL_AND_REDIRECT_PAGE = " You must provide a 'email' and 'redirectToPage' property";
    }
}`;
};