import { ValidateService } from "../../../services";

export const jwtAuthControllerTemplate = (projectName: string, modelName: string): string => {
return `using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ${projectName}.Business.Enums;
using ${projectName}.Business.Interfaces;
using ${projectName}.Models.Database;

namespace ${projectName}.Controllers
{
    [Route("api/authentication")]
    public class JWTokenAuthController : Controller
    {
        private IJWTokenAuthBusiness _business;

        public JWTokenAuthController(IJWTokenAuthBusiness jWTokenAuthBusiness)
        {
            this._business = jWTokenAuthBusiness;
        }

        [HttpGet("info")]
        [Authorize]
        public object Get${ValidateService.capitalizeFirstLetter(modelName)}Info()
        {
            var claimsIdentity = ${ValidateService.capitalizeFirstLetter(modelName)}.Identity as ClaimsIdentity;

            return this._business.Get${ValidateService.capitalizeFirstLetter(modelName)}Info(int.Parse(claimsIdentity.FindFirst("id").Value));
        }

        [HttpGet("verifytoken/{token}")]
        public object Get${ValidateService.capitalizeFirstLetter(modelName)}Info(string token)
        {
            if (String.IsNullOrEmpty(token))
            {
                BadRequest(new
                {
                    code = BaseResponseCode.AUTHENTICATE_BAD_REQUEST,
                    message = "You must provide a 'token' parameter"
                });
            }

            return this._business.VerifyToken(token);
        }

        // Public
        [HttpPost]
        public object GetAuthToken([FromBody]${ValidateService.capitalizeFirstLetter(modelName)} model)
        {
            ModelState.Remove("name");
            ModelState.Remove("role");
            ModelState.Remove("last_name");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            return this._business.Login(model);
        }

        // Public
        [HttpPost("refresh")]
        public object Refresh(string token, string refreshToken)
        {
            if (String.IsNullOrEmpty(token) || String.IsNullOrEmpty(refreshToken))
            {
                BadRequest(new
                {
                    code = BaseResponseCode.AUTHENTICATE_BAD_REQUEST,
                    message = BaseResponseMessage.INVALID_TOKEN_AND_REFRESH_TOKEN,
                });
            }

            return this._business.RefreshToken(token, refreshToken);
        }

        // Public
        [HttpPost("send/email/resetpassword")]
        public object SendEmailResetPassword(string email, string redirectToPage)
        {
            if (String.IsNullOrEmpty(email) || String.IsNullOrEmpty(redirectToPage))
            {
                BadRequest(new
                {
                    code = BaseResponseCode.AUTHENTICATE_BAD_REQUEST,
                    message = BaseResponseMessage.INVALID_EMAIL_AND_REDIRECT_PAGE
                });
            }

            return this._business.SendResetPasswordEmail(email, redirectToPage);
        }

        [HttpPut("resetpassword")]
        public object ResetPassword(string password, string token)
        {
            if (String.IsNullOrEmpty(password) || String.IsNullOrEmpty(token))
            {
                BadRequest(new
                {
                    code = BaseResponseCode.AUTHENTICATE_BAD_REQUEST,
                    message = BaseResponseMessage.INVALID_PASSWORD_TOKEN
                });
            }
            return this._business.ResetPassword(token, password);
        }

    }
}`;
};
    
    
    