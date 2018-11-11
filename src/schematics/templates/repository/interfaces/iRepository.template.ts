import { ValidateService } from "../../../../services";

export const iRepositoryTemplate = (projectName: string, className: string, modelName: string): string => {
    return `using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ${projectName}.Models.Database;

namespace ${projectName}.Repository.Interfaces
{
    public interface I${ValidateService.capitalizeFirstLetter(className)}Repository : IBaseRepository<${ValidateService.capitalizeFirstLetter(modelName)}>
    {
    }
}`;
};


