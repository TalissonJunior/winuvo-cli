export const emailTemplateHtmlTemplate = (projectName: string): string => {
    return `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${projectName}.Business.Enums
{
    public static class EmailTemplateHTML
    {
        public static string WELCOME = "welcome.html";
        public static string VERIFY_EMAIL = "verify-email.html";
        public static string RESET_PASSWORD_EMAIL = "reset-pass.html";
    }
}`;
};