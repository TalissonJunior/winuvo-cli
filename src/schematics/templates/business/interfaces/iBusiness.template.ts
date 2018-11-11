import { ValidateService } from "../../../../services";

export const iBusinessTemplate = (projectName: string, className: string, modelName: string): string => {
    return `using System.Collections.Generic;
using System;
using System.Threading.Tasks;
using ${projectName}.Models.Database;
using ${projectName}.Business.Utilities;

namespace ${projectName}.Business.Interfaces
{
    public interface I${ValidateService.capitalizeFirstLetter(className)}Business : IBaseBusiness<${ValidateService.capitalizeFirstLetter(modelName)}>
    {
    }
}`;
};