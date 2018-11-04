import { ValidateService } from "../../../../services";

export const businessTemplate = (projectName: string, modelName: string): string => {
return `using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using ${projectName}.Repository.Interfaces;
using ${projectName}.Repository.Repositories;
using ${projectName}.Models.Database;
using ${projectName}.Business.Interfaces;
using ${projectName}.Business.Utilities;
using System.Text;
using System.Linq;

namespace ${projectName}.Business.Rules
{
    public class ${ValidateService.capitalizeFirstLetter(modelName)}Business : BaseBusiness<I${ValidateService.capitalizeFirstLetter(modelName)}Repository, ${ValidateService.capitalizeFirstLetter(modelName)}>, I${ValidateService.capitalizeFirstLetter(modelName)}Business
    {
        private IConfiguration _configuration;
        private BaseResponse _baseResponse;

        public ${ValidateService.capitalizeFirstLetter(modelName)}Business(I${ValidateService.capitalizeFirstLetter(modelName)}Repository repository, IConfiguration config) : base(repository)
        {
            _configuration = config;
            _baseResponse = new BaseResponse();
        }

    }
}`;
};
    
        
        