export const emailTemplate = (projectName: string): string => {
    return `using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.Extensions.Configuration;
using ${projectName}.Business.Enums;

namespace ${projectName}.Business.Utilities
{
    /**
        If Using Gmail make sure you enable the option 'Allow less secure apps'
        at: https://myaccount.google.com/u/1/security?hl=en
     */
    public class Email
    {
        private SmtpClient client;
        private string senderEmail;
        private string senderPassword;
        private string templatePaths;
        private string clientServerUrl;

        public Email(IConfiguration config)
        {
            this.senderEmail = config.GetSection("Email")["Email"];
            this.senderPassword = config.GetSection("Email")["Password"];
            this.templatePaths = config.GetSection("Email")["TemplatePath"];
            this.clientServerUrl = config.GetSection("Email")["ClientServerUrl"];

            client = new SmtpClient
            {
                Host = "smtp.gmail.com", // set your SMTP server name here
                Port = 587, // Port 
                EnableSsl = true,
                Credentials = new NetworkCredential(this.senderEmail, this.senderPassword)
            };
        }

        public bool SendWelcomeEmail(SendEmailOptions options)
        {
            return this.SendEmail(options, EmailTemplateHTML.WELCOME);
        }

        public bool SendResetPasswordEmail(SendEmailOptions options)
        {
            return this.SendEmail(options, EmailTemplateHTML.RESET_PASSWORD_EMAIL);
        }

        private bool SendEmail(SendEmailOptions options, string emailTemplate)
        {
            string template;
            using (StreamReader SourceReader = System.IO.File.OpenText(this.templatePaths + emailTemplate))
            {
                template = SourceReader.ReadToEnd();
                template = template.Replace("{{RedirectLink}}", this.clientServerUrl + options.redirectPage);
                template = template.Replace("{{ClientServerUrl}}", this.clientServerUrl);
                template = template.Replace("{{SubjectSubTitle}}", options.subjectSubTitle);
                template = template.Replace("{{SubjectName}}", options.subjectName);
            }

            using (var message = new MailMessage(this.senderEmail, options.subjectEmails)
            {
                BodyEncoding = System.Text.Encoding.UTF8,
                SubjectEncoding = System.Text.Encoding.UTF8,
                Subject = options.subjectTitle,
                Body = template,
                Sender = new MailAddress(this.senderEmail, "my project name"),
                IsBodyHtml = true
            })
            {
                try
                {
                    this.client.Send(message);
                    return true;
                }
                catch 
                {
                    return false;
                }
            }
        }

    }
}`;
};