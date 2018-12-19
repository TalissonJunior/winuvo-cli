import { ValidateService } from "../../../../services";

export const ijwtAuthBusinessTemplate = (projectName: string, modelName: string): string => {
return `using System.Collections.Generic;
using System;
using System.Threading.Tasks;
using ${projectName}.Models.Database;
using ${projectName}.Business.Utilities;

namespace ${projectName}.Business.Interfaces
{
    public interface IJWTokenAuthBusiness : IBaseBusiness<${ValidateService.capitalizeFirstLetter(modelName)}>
    {
        BaseResponse Get${ValidateService.capitalizeFirstLetter(modelName)}Info(int id);
        BaseResponse Login(${ValidateService.capitalizeFirstLetter(modelName)} model);
        BaseResponse RefreshToken(string token, string refreshToken);
        BaseResponse VerifyToken(string token);
        BaseResponse ResetPassword(string token, string password);
        BaseResponse SendResetPasswordEmail(string email, string redirectToPage);
    }
}`;
};
    
    
    