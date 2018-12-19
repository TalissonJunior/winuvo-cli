export const startupImportsTemplate = (projectName: string): string => {
return `using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using ${projectName}.Business.Enums;
using ${projectName}.Business.Interfaces;
using ${projectName}.Business.Rules;
using ${projectName}.Repository.Interfaces;
using ${projectName}.Repository.Repositories;
using Newtonsoft.Json;
using System.Text;`;
};

export const startupConfigureServicesTemplate = (): string => {
    return `  
            services.AddCors();

            services.AddAuthorization(auth =>
            {
                auth.AddPolicy("Bearer", new AuthorizationPolicyBuilder()
                    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme‌​)
                    .RequireAuthenticatedUser().Build());
            });

            services.AddAuthentication(options =>
            {
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                var keyByteArray = Encoding.ASCII.GetBytes(Configuration.GetSection("JWTToken")["SigninKey"]);
                var signingKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(keyByteArray);

                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    IssuerSigningKey = signingKey,
                    ValidAudience = Configuration.GetSection("JWTToken")["Audience"],
                    ValidIssuer = Configuration.GetSection("JWTToken")["Issuer"],
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(0)
                };

                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        Func<Task> callback = async () =>
                           {
                               if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                               {
                                   context.Response.Headers.Add("Token-Expired", "true");
                                   context.Response.Headers.Add("Access-Control-Expose-Headers", "Token-Expired");

                                   await context.Response.WriteAsync(JsonConvert.SerializeObject(new
                                   {
                                       code = BaseResponseCode.AUTHENTICATE_EXPIRED_TOKEN,
                                       message = context.Exception.Message
                                   }));
                               }
                               else if (context.Exception.GetType() == typeof(SecurityTokenException))
                               {
                                   context.Response.StatusCode = 400;
                                   await context.Response.WriteAsync(JsonConvert.SerializeObject(new
                                   {
                                       code = BaseResponseCode.AUTHENTICATE_INVALID_TOKEN,
                                       message = context.Exception.Message
                                   }));
                               }

                           };

                        context.Response.OnStarting(callback);

                        return Task.CompletedTask;
                    }
                };

            });
`;
};

export const startupConfigureIsDevelopmentTemplate = (): string => {
    return `                app.UseCors(builder => builder
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials());`;
};

export const startupConfigureIsProductionTemplate = (): string => {
    return `                app.UseCors(builder => builder
                .WithOrigins("http://localhost:4200")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials());`;
};

export const startupConfigureExceptionTemplate = (): string => {
    return `            app.UseExceptionHandler(appBuilder =>
            {
                appBuilder.Use(async (context, next) =>
                {
                    var erro = context.Features[typeof(IExceptionHandlerFeature)] as IExceptionHandlerFeature;
        
                    if (erro != null && erro.Error != null)
                    {
                        context.Response.StatusCode = 500;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonConvert.SerializeObject(new {
                            code = BaseResponseCode.INTERNAL_SERVER_ERROR, 
                            message = erro.Error.Message
                        }));
                    }
                    //when no error, do next.
                    else await next();
                });
            });
        
            app.UseCors("policy");
            app.UseAuthentication();`;
};
