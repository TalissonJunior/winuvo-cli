import { ValidateService } from "../../../services";

export const viewModelTemplate = (projectName: string, viewModelName: string, modelName: string, content: string): string => {
return `using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ${projectName}.Models.Database;

namespace ${projectName}.Models.ViewModels
{
    public class ${ValidateService.capitalizeFirstLetter(viewModelName)}VM : ${ValidateService.capitalizeFirstLetter(modelName)} 
    {
        ${content}
    }
}`;
};