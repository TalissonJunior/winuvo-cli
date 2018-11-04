import { ValidateService } from "../../../../services";

export const repositoryTemplate = (projectName: string, modelName: string): string => {
return `using System;
using System.Collections.Generic;
using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using ${projectName}.Repository.Interfaces;
using ${projectName}.Models.Database;
using System.Collections;
using System.Linq;

namespace ${projectName}.Repository.Repositories
{
    public class ${ValidateService.capitalizeFirstLetter(modelName)}Repository : BaseRepository<${ValidateService.capitalizeFirstLetter(modelName)}>, I${ValidateService.capitalizeFirstLetter(modelName)}Repository
    {
        public ${ValidateService.capitalizeFirstLetter(modelName)}Repository(IConfiguration config) : base(config)
        {
        }
    }
}`;
};
    
        
        