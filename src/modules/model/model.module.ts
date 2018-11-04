import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseModule } from "../database/database.module";
import { BaseModule } from "../base.module";
import { ModelOptions } from '../../models/model-options';
import { TableTree } from '../../models/interfaces/table-tree';
import { Table } from '../../models/interfaces';
import { MyslToCSHARPTypes } from './constants/mysql-csharp-types';
import { modelTemplate } from '../../schematics/templates/model/model.template';
import { Schematics } from '../../schematics/schematics';
import { ValidateService } from '../../services';
import { validCreatedDateFields, validUpdatedDateFields } from './constants/valid-create-update-date-fields';

export class ModelModule extends BaseModule {
    database: DatabaseModule;
    schematics: Schematics;

    constructor(spinner?: ora) {
        super(spinner);
        this.database = new DatabaseModule();
        this.schematics = new Schematics();
    }

    create(options: ModelOptions, callback: BaseCallback): void {

        this.database.connect(null, (databaseResponse) => {
            var tableName = options.name == options.table ? options.name : options.table;
         
            if (databaseResponse.data) {
                var table;

                table = this.database.tablesTree.find((table) => table.name.toLowerCase() == tableName.toLowerCase());
             
                if (table) {
                    var modelTemplate = this._createModelFileTemplate(table, options.name);
                    var modelPath = path.join(process.cwd(), this.config['modelPath']['main']);
                    var modelExtension = ValidateService.capitalizeFirstLetter(options.name)  + this.config['modelPath']['suffixExtension'];

                    if(!fs.existsSync(path.join(modelPath, modelExtension))){
                       
                        if (this.schematics.createFile(modelPath, modelTemplate, modelExtension)) {
                            callback(this.response.setData(true));
                        }
                        else{
                            callback(this.response.setError('Fail to create model', ' Could not create the model'));
                        }
                    }
                    else{
                        callback(this.response.setError('Model already exists', `Already exists a model ${path.join(modelPath, modelExtension)}`));
                    }
                }
                else {
                    callback(this.response.setError('Fail to create model, table not found', `Could not find a table in database "${this.database.connectionString.database}" with name "${tableName}"\n Make sure you provide "--table=your-table" flag`));
                }

            }
            else {
                callback(databaseResponse);
            }
        });

    }

    private _createModelFileTemplate(table: TableTree | Table, modelName: string): string {
        var content = '';
        const N = "\n"; //Break line
        const T = "\t"; //Tab line

        table.columns.forEach((column, index) => {
            if (column.Type.indexOf('(') > -1) {
                column.Type = column.Type.substr(0, column.Type.indexOf('('));
            }

            column.Type = MyslToCSHARPTypes[column.Type.toUpperCase()].type;

            if (validCreatedDateFields[column.Field]) {
                content += `${T + T}[CreatedAt]`;
            }
            else if (validUpdatedDateFields[column.Field]) {
                content += `${T + T}[UpdatedAt]`;
            }

            if (column.Key == 'PRI') {
                content += `[PrimaryKey]`;
            }
            else if (column.Null == 'NO' && (!validCreatedDateFields[column.Field] && !validUpdatedDateFields[column.Field])) {
                content += `${T + T}[Required(ErrorMessage = "${column.Field} is required")]`;
            }

            content += `${N + T + T}public ${column.Type} ${column.Field} { get; set; }`;

            if (index < table.columns.length - 1) {
                content += N + N;
            }
            else {
                content += N;
            }
        });

        return modelTemplate(this.config['Project']['name'], modelName, table, content);
    }
}