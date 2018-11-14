import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as pluralize from 'pluralize';
import { BaseModule } from "../base.module";
import { ModelOptions } from '../../models/model-options';
import { TableTree } from '../../models/interfaces/table-tree';
import { Table, ModelFile, ModelFileCreate } from '../../models/interfaces';
import { MyslToCSHARPTypes } from './constants/mysql-csharp-types';
import { modelTemplate } from '../../schematics/templates/model/model.template';
import { ValidateService } from '../../services';
import { validCreatedDateFields, validUpdatedDateFields } from './constants/valid-create-update-date-fields';
import { viewModelTemplate } from '../../schematics/templates/model';


export class ModelModule extends BaseModule {

    constructor(spinner?: ora) {
        super(spinner);
    }

    create(options: ModelOptions, callback: BaseCallback, throwErrorIfExists = true): void {

        this.database.connect(null, (databaseResponse) => {
            var tableName = options.name == options.table ? options.name : options.table;

            if (databaseResponse.data) {

                  //REMOVE
                  fs.writeFileSync(path.join(process.cwd() + 'teste.json'), JSON.stringify(this.database.tablesTree));
                  //REMOVE

                this.createModel(tableName, options.name, (response) => {
                    if (response.data) {

                        if(response.data != 'skip'){
                            callback(this.response.setData((<ModelFileCreate>response.data).message));
                        }
                        else{
                            callback(this.response.setData(response.data));
                        }
                    }
                    else {
                        callback(response);
                    }
                }, throwErrorIfExists);

            }
            else {
                callback(databaseResponse);
            }
        });

    }

    createModel(tableName: string, modelName: string, callback: BaseCallback , throwErrorIfExists = true) {

        var table = this.database.tablesTree.find((table) => table.name.toLowerCase() == tableName.toLowerCase());

        if (table) {
            var modelTemplate = this._createModelFileTemplate(table, modelName);
            var modelPath = path.join(process.cwd(), this.config['modelPath']['main']);
            var modelNamWithExtension = ValidateService.capitalizeFirstLetter(modelName) + this.config['modelPath']['suffixExtension'];

            if (!fs.existsSync(path.join(modelPath, modelNamWithExtension))) {

                if (this.schematics.createFile(modelPath, modelTemplate, modelNamWithExtension)) {
                    callback(this.response.setData({
                        fileName: path.parse(modelNamWithExtension).name,
                        fileNameWithExtension: modelNamWithExtension,
                        fileExtension: path.parse(modelNamWithExtension).ext,
                        modelName: modelName,
                        tableName: tableName,
                        created: true,
                        message: `<create/> ${path.join(modelPath, modelNamWithExtension)}`
                    } as ModelFileCreate));
                }
                else {
                    callback(this.response.setError('Fail to create model', ' Could not create the model'));
                }
            }
            else {
                if(!throwErrorIfExists){
                    callback(this.response.setData('skip'));
                }
                else{
                    callback(this.response.setError('Model already exists', `Already exists a model ${path.join(modelPath, modelNamWithExtension)}`));
                }
            }
        }
        else {
            callback(this.response.setError('Fail to create model, table not found', `Could not find a table in database "${this.database.connectionString.database}" with name "${tableName}"\n Make sure you provide "--table=your-table" flag`));
        }
    }

    createViewModel(viewModelName: string, modelTableTree: TableTree, callback: BaseCallback) {

        var viewModelTemplate = this._createViewModelFileTemplate(viewModelName, modelTableTree);
        var viewModelPath = path.join(process.cwd(), this.config['viewModelPath']['main']);
        var viewModelNameWithExtension = ValidateService.capitalizeFirstLetter(viewModelName) + this.config['viewModelPath']['suffixExtension'];

        if (!fs.existsSync(path.join(viewModelPath, viewModelNameWithExtension))) {

            if (this.schematics.createFile(viewModelPath, viewModelTemplate, viewModelNameWithExtension)) {
                callback(this.response.setData({
                    fileName: path.parse(viewModelNameWithExtension).name,
                    fileNameWithExtension: viewModelNameWithExtension,
                    fileExtension: path.parse(viewModelNameWithExtension).ext,
                    modelName: viewModelName,
                    tableName: '',
                    created: true,
                    message: `<create/> ${path.join(viewModelPath, viewModelNameWithExtension)}`
                } as ModelFileCreate));
            }
            else {
                callback(this.response.setError('Fail to create view model', ' Could not create the view model'));
            }
        }
        else {
            callback(this.response.setError('View Model already exists', `Already exists a view model ${path.join(viewModelPath, viewModelNameWithExtension)}`));
        }
    }

    createModelBasedOnTableNames(tables: Array<string>, callback: BaseCallback) {
        var tablesReturn = [] as Array<ModelFile>; // this will be the return;

        if (tables.length) {
            var memoryTables = _.clone(tables); // Make sure we don´t keep the reference

            // Check the tables that exists
            this.readFiles(path.join(process.cwd(), this.config['modelPath']['main']), (fileNameWithExtension, content, isTheLastFile) => {

                var modelName = this.getModelNameFromFile(content);
                var tableName = this.getTableNameFromFile(content);

                var index = memoryTables.findIndex((name) => name == tableName);

                if (index > -1) {

                    tablesReturn.push({
                        fileName: path.parse(fileNameWithExtension).name,
                        fileNameWithExtension: fileNameWithExtension,
                        fileExtension: path.parse(fileNameWithExtension).ext,
                        modelName: modelName,
                        tableName: tableName
                    });

                    memoryTables.splice(index, 1);
                }

                if (isTheLastFile) {

                    // Create the tables that are left
                    if (memoryTables.length > 0) {
                        var modelPromises = [];

                        memoryTables.forEach((tableName) => {

                            var modelName = ValidateService.transformStringToCamelCase(tableName);

                            var promise = new Promise((resolve, reject) => {
                                this.createModel(tableName, modelName, (createModelResponse) => {

                                    if(createModelResponse.data){
                                        resolve(createModelResponse.data);
                                    }
                                    else{
                                        var modelPath = createModelResponse.error.message.substr('Already exists a model'.length).trim();

                                        resolve({
                                            fileName: path.parse(modelPath).name,
                                            fileNameWithExtension: path.parse(modelPath).name + path.parse(modelPath).ext,
                                            fileExtension: path.parse(modelPath).ext,
                                            modelName: modelName,
                                            tableName: tableName,
                                            created: true,
                                            message: `<update/> ${path.join(modelPath, path.parse(modelPath).name + path.parse(modelPath).ext)}`
                                        } as ModelFileCreate);
                                    }
                                });
                            });

                            modelPromises.push(promise);
                        });

                        Promise.all(modelPromises).then((result) => {
                            tablesReturn = tablesReturn.concat(result);
                            callback(this.response.setData(tablesReturn));

                        }, (error) => {
                            callback(error);
                        });
                    }
                    else {
                        callback(this.response.setData(tablesReturn));
                    }
                }
            },
                (error: NodeJS.ErrnoException) => {
                    callback(this.response.setError('Fail to read file', error.message));
                });
        }
        else {
            callback(this.response.setData(tablesReturn));
        }
    }

    getTableNameFromModel(modelName: string): string {
        var modelPath = path.join(process.cwd(), this.config['modelPath']['main'], modelName + this.config['modelPath']['suffixExtension']);
        var modelFile = fs.readFileSync(modelPath, 'utf8');

        return this.schematics.getStringBetween(modelFile, '[Table("', '")]');
    }

    getTableNameFromFile(file: string): string {
        return this.schematics.getStringBetween(file, '[Table("', '")]');
    }

    getModelNameFromFile(file: string): string {
        return this.schematics.getStringAfter(file, 'public class ');
    }

    private _createViewModelFileTemplate(viewModelName: string, modelTableTree: TableTree): string {
        var content = '';
        const N = "\n"; //Break line
        const T = "\t"; //Tab line

        modelTableTree.references.forEach((table, index) => {
            content += `public ${ValidateService.capitalizeFirstLetter(table.referencedTable.name)} ${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)} { get; set; }`;

            if (index < modelTableTree.references.length - 1) {
                content += N + N;
            }
            else {
                content += N;
            }
        });

        modelTableTree.middleTables.forEach((table, index) => {
            var modelListName = ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name);
            content += `${N + T + T}public List<${ValidateService.capitalizeFirstLetter(modelListName)}> ${pluralize.plural(ValidateService.lowercaseFirstLetter(modelListName))} { get; set; }`;

            if (index < modelTableTree.middleTables.length - 1) {
                content += N;
            }
        });

        return viewModelTemplate(this.config['Project']['name'], viewModelName, ValidateService.capitalizeFirstLetter(modelTableTree.name), content);
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
                content += `[Key, PrimaryKey]`;
            }
            else if (column.Null == 'NO' && (!validCreatedDateFields[column.Field] && !validUpdatedDateFields[column.Field])) {
                content += `${T + T}[Required(ErrorMessage = "${column.Field} is required")]`;
            }

            var breakLine = column.Null == 'NO' ? N : '';
            content += `${breakLine + T + T}public ${column.Type} ${column.Field} { get; set; }`;

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