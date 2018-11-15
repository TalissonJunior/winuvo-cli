import { ValidateService } from "../../../../services";

export const jwtAuthBusinessTemplate = (projectName: string, modelName: string): string => {
return `using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using ${projectName}.Repository.Interfaces;
using ${projectName}.Models.Database;
using ${projectName}.Business.Interfaces;
using ${projectName}.Business.Enums;
using ${projectName}.Business.Utilities;
using ${projectName}.Repository.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Newtonsoft.Json;
using System.Text;
using System.Linq;

namespace ${projectName}.Business.Rules
{
    public class JWTokenAuthBusiness : BaseBusiness<IJWTokenAuthRepository, ${ValidateService.capitalizeFirstLetter(modelName)}>, IJWTokenAuthBusiness
    {
        private IConfiguration _configuration;
        private BaseResponse _baseResponse;
        public JWTokenAuthBusiness(IJWTokenAuthRepository repository, IConfiguration config) : base(repository)
        {
            _configuration = config;
            _baseResponse = new BaseResponse();
        }

        /*In this app the email is the same as login  */
        public BaseResponse SendResetPasswordEmail(string email, string redirectToPage)
        {
            try
            {
                redirectToPage = redirectToPage.StartsWith('/') ? redirectToPage : "/" + redirectToPage;
                redirectToPage = redirectToPage.EndsWith('/') ? redirectToPage : redirectToPage + "/";
                var ${ValidateService.lowercaseFirstLetter(modelName)} = this._repository.GetByLogin(email);
                if (${ValidateService.lowercaseFirstLetter(modelName)} != null)
                {
                    var token = GenerateToken(${ValidateService.lowercaseFirstLetter(modelName)}, DateTime.Now.AddSeconds(60));
                    new Email(_configuration).SendResetPasswordEmail(new SendEmailOptions()
                    {
                        subjectEmails = ${ValidateService.lowercaseFirstLetter(modelName)}.email,
                        subjectName = ${ValidateService.lowercaseFirstLetter(modelName)}.name,
                        redirectPage = redirectToPage + token,
                        subjectTitle = "Welcome to my website",
                        subjectSubTitle = "Looks like you tried to attemp to login a couple of times"
                    });
                    return _baseResponse.setData(true);
                }
                return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_LOGIN, BaseResponseMessage.USER_NOT_FOUND);
            }
            catch (Exception error)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, error.Message);
            }
        }

        public BaseResponse Get${ValidateService.capitalizeFirstLetter(modelName)}Info(int id)
        {
            try
            {
                var ${ValidateService.lowercaseFirstLetter(modelName)} = this._repository.get(id);
                if (${ValidateService.lowercaseFirstLetter(modelName)} != null)
                {
                    return _baseResponse.setData(new
                    {
                        name = ${ValidateService.lowercaseFirstLetter(modelName)}.name,
                        role = ${ValidateService.lowercaseFirstLetter(modelName)}.role
                    });
                }
                return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_LOGIN, BaseResponseMessage.USER_NOT_FOUND);
            }
            catch (Exception error)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, error.Message);
            }
        }

        public BaseResponse Login(${ValidateService.capitalizeFirstLetter(modelName)} model)
        {
            try
            {
                var ${ValidateService.lowercaseFirstLetter(modelName)} = this._repository.GetByLogin(model.login);
                if (${ValidateService.lowercaseFirstLetter(modelName)} != null)
                {
                    var password_hash = Hash.CreatePasswordHash(model.password, ${ValidateService.lowercaseFirstLetter(modelName)}.password_salt);
                    if (password_hash == ${ValidateService.lowercaseFirstLetter(modelName)}.password)
                    {
                        ${ValidateService.lowercaseFirstLetter(modelName)}.password_salt = Hash.CreateSalt();
                        ${ValidateService.lowercaseFirstLetter(modelName)}.password = Hash.CreatePasswordHash(model.password, ${ValidateService.lowercaseFirstLetter(modelName)}.password_salt);
                        return _baseResponse.setData(TokenHandler(${ValidateService.lowercaseFirstLetter(modelName)})); 
                    }
                    return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_LOGIN, BaseResponseMessage.WRONG_PASSWORD);
                }
                return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_LOGIN, BaseResponseMessage.USER_NOT_FOUND);
            }
            catch (Exception error)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, error.Message);
            }
        }

        public BaseResponse RefreshToken(string token, string refreshToken)
        {
            try
            {
                var principal = GetPrincipalFromToken(token);
                if (principal == null)
                {
                    return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_TOKEN, BaseResponseMessage.INVALID_TOKEN);
                }
                var claimsIdentity = principal.Identity as ClaimsIdentity;
                var user = this._repository.get(Int32.Parse(claimsIdentity.FindFirst("id").Value));
                if (user.refresh_token != refreshToken)
                {
                    return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_REFRESH_TOKEN, BaseResponseMessage.INVALID_REFRESH_TOKEN);
                }
                return _baseResponse.setData(TokenHandler(user));
            }
            catch (Exception error)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, error.Message);
            }
        }

        public BaseResponse ResetPassword(string token, string password)
        {
            try
            {
                var principal = GetPrincipalFromToken(token);
                if (principal == null)
                {
                    return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_TOKEN, BaseResponseMessage.INVALID_TOKEN);
                }
                var claimsIdentity = principal.Identity as ClaimsIdentity;
                var ${ValidateService.lowercaseFirstLetter(modelName)} = this._repository.get(Int32.Parse(claimsIdentity.FindFirst("id").Value));
                if (${ValidateService.lowercaseFirstLetter(modelName)} != null)
                {
                    ${ValidateService.lowercaseFirstLetter(modelName)}.password_salt = Hash.CreateSalt();
                    ${ValidateService.lowercaseFirstLetter(modelName)}.password = Hash.CreatePasswordHash(password, user.password_salt);
                    ${ValidateService.lowercaseFirstLetter(modelName)}.email_verified = YesOrNo.YES;
                    var response = this._repository.update(${ValidateService.lowercaseFirstLetter(modelName)});
                    if (response)
                    {
                        return _baseResponse.setData(true);
                    }
                    return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_FAIL_UPDATE, BaseResponseMessage.AUTHENTICATE_FAIL_UPDATE);    
                }
                return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_LOGIN, BaseResponseMessage.USER_NOT_FOUND);
            }
            catch (Exception error)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, error.Message);
            }
        }

        public BaseResponse VerifyToken(string token)
        {
            try
            {
                var principal = GetPrincipalFromToken(token, true);
                if (principal != null) return _baseResponse.setData(true);
                return _baseResponse.setError(BaseResponseCode.AUTHENTICATE_INVALID_TOKEN, BaseResponseMessage.INVALID_TOKEN);
            }
            catch (Exception error)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, error.Message);
            }

        }

        private BaseResponse TokenHandler(${ValidateService.capitalizeFirstLetter(modelName)} ${ValidateService.lowercaseFirstLetter(modelName)})
        {
            try
            {
                var requestAt = DateTime.Now;
                var expiresIn = requestAt.Add(TimeSpan.FromSeconds(int.Parse(_configuration.GetSection("JWTToken")["SecondsToExpire"])));
                var newToken = GenerateToken(${ValidateService.lowercaseFirstLetter(modelName)}, expiresIn);
                var newRefreshToken = GenerateRefreshToken();
                ${ValidateService.lowercaseFirstLetter(modelName)}.refresh_token = newRefreshToken;
                this._repository.update(${ValidateService.lowercaseFirstLetter(modelName)});
                return _baseResponse.setData(new
                {
                    requestAt = requestAt,
                    tokenExpiration = Math.Round((expiresIn - DateTime.Now).TotalSeconds, 0),
                    tokenType = "Bearer",
                    accessToken = newToken,
                    refreshToken = newRefreshToken,
                    firstName = ${ValidateService.lowercaseFirstLetter(modelName)}.name
                });
            }
            catch (Exception error)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, error.Message);
            }
        }

        private string GenerateToken(${ValidateService.capitalizeFirstLetter(modelName)} ${ValidateService.lowercaseFirstLetter(modelName)}, DateTime expires)
        {
            var handler = new JwtSecurityTokenHandler();

            ClaimsIdentity identity = new ClaimsIdentity(
                new[] {
                        new Claim("id", ${ValidateService.lowercaseFirstLetter(modelName)}.id.ToString())
                }
            );

            var keyByteArray = Encoding.ASCII.GetBytes(_configuration.GetSection("JWTToken")["SigninKey"]);
            var signingKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(keyByteArray);
            var securityToken = handler.CreateToken(new SecurityTokenDescriptor
            {
                Audience = _configuration.GetSection("JWTToken")["Audience"],
                Issuer = _configuration.GetSection("JWTToken")["Issuer"],
                SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256),
                Subject = identity,
                Expires = expires,
                NotBefore = new DateTimeOffset(DateTime.Now).DateTime
            });
            return handler.WriteToken(securityToken);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        private ClaimsPrincipal GetPrincipalFromToken(string token, bool validateExpiration = false)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidateIssuer = true,
                ValidAudience = _configuration.GetSection("JWTToken")["Audience"],
                ValidIssuer = _configuration.GetSection("JWTToken")["Issuer"],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration.GetSection("JWTToken")["SigninKey"])),
                ValidateLifetime = validateExpiration //here we are saying that we don't care about the token's expiration date
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken securityToken;
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
            var jwtSecurityToken = securityToken as JwtSecurityToken;
            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }

    }
}`;
};
    
    
    