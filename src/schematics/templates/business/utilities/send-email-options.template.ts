export const sendEmailOptionsTemplate = (projectName: string): string => {
    return `using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using ${projectName}.Business.Enums;

namespace ${projectName}.Business.Utilities
{
    public class SendEmailOptions
    {
        public string redirectPage { get; set; }
        public string subjectEmails { get; set; }
        public string subjectName { get; set; }
        public string subjectTitle { get; set; }
        public string subjectSubTitle { get; set; }
    }
}`;
};