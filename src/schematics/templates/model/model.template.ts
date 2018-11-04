import { Table } from "../../../models/interfaces";
import { ValidateService } from "../../../services";

export const modelTemplate = (projectName: string, modelName: string, table: Table, content: string): string => {
    return `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ${projectName}.Models.Attributes;

namespace ${projectName}.Models.Database
{
    [Table("${table.name.toLowerCase()}")]
    public class ${ValidateService.capitalizeFirstLetter(modelName)}
    {
        ${content}
    }
}`;
};