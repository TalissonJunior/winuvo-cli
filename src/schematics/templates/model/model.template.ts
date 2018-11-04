import { Table } from "../../../models/interfaces";

export const modelTemplate = (projectName: string, modelName: string, table: Table, content: string): string => {
    return `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ${projectName}.Models.Attributes;

namespace ${projectName}.Models.Database
{
    [Table("${table.name.toLowerCase()}")]
    public class ${modelName.charAt(0).toUpperCase() + modelName.slice(1)}
    {
        ${content}
    }
}`;
};