import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import * as pluralize from 'pluralize';
import { BaseModule } from "../base.module";
import { ValidateService } from '../../services';
import { iRepositoryTemplate } from '../../schematics/templates/repository/interfaces';
import { repositoryTemplate } from '../../schematics/templates/repository/repositories';
import { TableTree } from '../../models/interfaces/table-tree';

export class RepositoryModule extends BaseModule {

    constructor(spinner?: ora) {
        super(spinner);
    }

    create(name: string, modelName: string, callback: BaseCallback, throwErrorIfExists = true): void {
        modelName = modelName.replace(/Repository/g, '');

        this.createRepository(name, modelName, (response) => {

            if (response.data) {
                callback(this.response.setData(response.data));
            }
            else {
                callback(response);
            }
        }, throwErrorIfExists);
    }

    createRepository(name: string, modelName: string, callback: BaseCallback, throwErrorIfExists = true) {

        var modelPath = path.join(process.cwd(), this.config['modelPath']['main']);
        var repositoryInterfacesPath = path.join(process.cwd(), this.config['repositoryPath']['interfaces']);
        var repositoryPath = path.join(process.cwd(), this.config['repositoryPath']['main']);

        var modelExtension = ValidateService.capitalizeFirstLetter(modelName) + this.config['modelPath']['suffixExtension'];
        var repositoryInterfaceExtension = 'I' + ValidateService.capitalizeFirstLetter(name) + this.config['repositoryPath']['suffixExtension'];
        var repositoryExtension = ValidateService.capitalizeFirstLetter(name) + this.config['repositoryPath']['suffixExtension'];

        if (!fs.existsSync(path.join(modelPath, modelExtension))) {
            callback(this.response.setError('Couldnt find model', `Coudn´t find a model with the name ${modelName} at ${path.join(modelPath, modelExtension)}`));
        }
        else if (fs.existsSync(path.join(repositoryInterfacesPath, repositoryInterfaceExtension))) {
            if(!throwErrorIfExists){
                callback(this.response.setData('skip'));
            }
            else{
                callback(this.response.setError('Already exists repository interface', `Already exists a repository interface ${path.join(repositoryInterfacesPath, repositoryInterfaceExtension)}`));
            }
        }
        else if (fs.existsSync(path.join(repositoryPath, repositoryExtension))) {
            if(!throwErrorIfExists){
                callback(this.response.setData('skip'));
            }
            else{
                callback(this.response.setError('Already exists repository', `Already exists a repository ${path.join(repositoryPath, repositoryExtension)}`));
            }
        }
        else {
            if (this.schematics.createFile(repositoryInterfacesPath, this._createRepositoryInterfaceFileTemplate(name, modelName), repositoryInterfaceExtension)) {

                if (this.schematics.createFile(repositoryPath, this._createRepositoryFileTemplate(name, modelName), repositoryExtension)) {

                    this.addStartupService(repositoryInterfaceExtension, repositoryExtension, (startupResponse) => {

                        if (startupResponse.data) {
                            var logStartup = startupResponse.data == true ? '' : '\n' + startupResponse.data;
                            callback(this.response.setData(`<create/> ${path.join(repositoryInterfacesPath, repositoryInterfaceExtension)}\n<create/> ${path.join(repositoryPath, repositoryExtension)}` + logStartup));
                        }
                        else {
                            callback(this.response.setData(`<create/> ${path.join(repositoryInterfacesPath, repositoryInterfaceExtension)}\n<create/> ${path.join(repositoryPath, repositoryExtension)}`));
                        }
                    });
                }
                else {
                    callback(this.response.setError('Fail to create repository', ' Could not create the repository'));
                }
            }
            else {
                callback(this.response.setError('Fail to create repository interface', ' Could not create the repository interface'));
            }
        }
    }

    createGetFullAllInterfaceTemplate(viewModelName: string): string {
        const T = "\t"; //Tab line
        return `${T + T} Task<IEnumerable<${viewModelName}VM>> getAllFull();`;
    }

    createGetFullByIdInterfaceTemplate(viewModelName: string, modelTableTree: TableTree): string {
        const T = "\t"; //Tab line

        var tableIdType = modelTableTree.columns.find((row) => row.Field.toLowerCase() == 'id').Type;
        tableIdType = tableIdType.indexOf('int') > -1 ? 'int' : 'long';

        return `${T + T} Task<${viewModelName}VM> getFullById(${tableIdType} ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}ID);`;
    }

    createMiddleTableMethodsTemplate(modelTableTree: TableTree): boolean {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line

        var tableIdType = modelTableTree.columns.find((row) => row.Field.toLowerCase() == 'id').Type;
        tableIdType = tableIdType.indexOf('int') > -1 ? 'int' : 'long';


        modelTableTree.middleTables.forEach((table) => {
            var getAllByTableMethodContent = `${N + T + T}public List<${ValidateService.transformStringToCamelCase(table.referencedTable.name)}> getAllBy${ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id(${tableIdType} ${table.foreignKeyColumnName})${N +
                T + T}{${N +
                T + T + T}using (IDbConnection conn = Connection)${N +
                T + T + T}{${N +
                T + T + T + T}string sql = @"SELECT * FROM ${table.referencedTable.name} WHERE ${table.foreignKeyReferenceTableColumnName} = @${table.foreignKeyColumnName}";${N + N +
                T + T + T + T}return conn.Query<${ValidateService.transformStringToCamelCase(table.referencedTable.name)}>(sql, new { ${table.foreignKeyColumnName} = ${table.foreignKeyColumnName} }).ToList();${N +
                T + T + T}}${N +
                T + T}}`;

            var getAllByTableInterfaceMethodContent = `${T + T} List<${ValidateService.transformStringToCamelCase(table.referencedTable.name)}> getAllBy${ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id(${tableIdType} ${table.foreignKeyColumnName});`;

            var getAllByMethodName = `getAllBy${ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id`;

            var deleteAllByTableMethodContent = `${N + T + T}public ${tableIdType} deleteAllBy${ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id(${tableIdType} ${table.foreignKeyColumnName})${N +
                T + T}{${N +
                T + T + T}using (IDbConnection conn = Connection)${N +
                T + T + T}{${N +
                T + T + T + T}string sql = @"DELETE FROM ${table.referencedTable.name} WHERE ${table.foreignKeyReferenceTableColumnName} = @${table.foreignKeyColumnName}";${N + N +
                T + T + T + T}return conn.Execute(sql, new { ${table.foreignKeyColumnName} = ${table.foreignKeyColumnName} });${N +
                T + T + T}}${N +
                T + T}}${N}`;
            
            var deleteAllByTableInterfaceMethodContent = `${T + T} ${tableIdType} deleteAllBy${ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id(${tableIdType} ${table.foreignKeyColumnName});`;

            var deleteAllByMethodName = `deleteAllBy${ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id`;

            var repositoryFilePath = path.join(process.cwd(), this.config['repositoryPath']['main'], ValidateService.transformStringToCamelCase(table.referencedTable.name) + this.config['repositoryPath']['suffixExtension']);
            var repositoryFileInterfacePath = path.join(process.cwd(), this.config['repositoryPath']['interfaces'], "I" + ValidateService.transformStringToCamelCase(table.referencedTable.name) + this.config['repositoryPath']['suffixExtension']);
            var repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');
            var repositoryFileInterfaceData = fs.readFileSync(repositoryFileInterfacePath, 'utf8');
            
            // Get all method
            if(repositoryFileData.indexOf(getAllByMethodName) < 0) {
                this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, getAllByTableMethodContent));
            }

            if(repositoryFileInterfaceData.indexOf(getAllByMethodName) < 0) {
                this.schematics.createFile(repositoryFileInterfacePath, this.schematics.addDataToClassBody(repositoryFileInterfaceData, getAllByTableInterfaceMethodContent));
            }

            // Delete all method
            repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');
            repositoryFileInterfaceData = fs.readFileSync(repositoryFileInterfacePath, 'utf8');

            if(repositoryFileData.indexOf(deleteAllByMethodName) < 0) {
                this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, deleteAllByTableMethodContent));
            }

            if(repositoryFileInterfaceData.indexOf(deleteAllByMethodName) < 0) {
                this.schematics.createFile(repositoryFileInterfacePath, this.schematics.addDataToClassBody(repositoryFileInterfaceData, deleteAllByTableInterfaceMethodContent));
            }

        });

        return true;
    }

    createGetFullAllTemplate(viewModelName: string, modelTableTree: TableTree): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line

        var tableNamesWithSuffix = modelTableTree.references.map(table => ' ' + ValidateService.lowercaseFirstLetter(table.referencedTable.name) + '_tb.*').join(',');
        var tableNamesWithSuffixSeparator = tableNamesWithSuffix.length > 0 ? ', ' : '';

        var tableListNamesWithSuffix = modelTableTree.middleTables.map(table => ' ' + ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name) + '_tb.*').join(',');

        // Create the sql
        var sql = `@"SELECT ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.*,${tableNamesWithSuffix}${tableNamesWithSuffixSeparator}${tableListNamesWithSuffix}${N}`;
        sql += `${T + T + T + T + T + T}FROM ${modelTableTree.name} as ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb${N}`;

        modelTableTree.middleTables.forEach((table) => {
            // middle table
            sql += `${T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.foreignKeyReferenceTableColumnName} = ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.${table.foreignKeyColumnName}${N}`;

            // middle table lists
            sql += `${T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.references[0].referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.referencedTable.references[0].foreignKeyColumnName} = ${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)}_tb.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName}`;
        });

        modelTableTree.references.forEach((table, index) => {
            // middle table
            if(modelTableTree.middleTables.length > 0 && index == 0)
                sql += N;

            if(index > 0){
                sql += N;
            }

            sql += `${N + T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.${table.foreignKeyColumnName} = ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.foreignKeyReferenceTableColumnName}`;
        });

        sql += '";';

        var methodContent = `${N + T + T}public async Task<IEnumerable<${viewModelName}VM>> getAllFull()${N}`;
        methodContent += `${T + T}{${N}`;
        methodContent += `${T + T + T}string sql = ${sql}${N + N}`;
        methodContent += `${T + T + T}var result = await _${ValidateService.lowercaseFirstLetter(viewModelName)}Query(sql, null);${N}`;
        methodContent += `${T + T + T}return result.Distinct().ToList();${N}`;
        methodContent += `${T + T}}${N}`;

        return methodContent;
    }

    createGetFullByIdTemplate(viewModelName: string, modelTableTree: TableTree): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line

        var tableNamesWithSuffix = modelTableTree.references.map(table => ' ' + ValidateService.lowercaseFirstLetter(table.referencedTable.name) + '_tb.*').join(',');
        var tableNamesWithSuffixSeparator = tableNamesWithSuffix.length > 0 ? ', ' : '';

        var tableListNamesWithSuffix = modelTableTree.middleTables.map(table => ' ' + ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name) + '_tb.*').join(',');

        // Create the sql
        var sql = `@"SELECT ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.*,${tableNamesWithSuffix}${tableNamesWithSuffixSeparator}${tableListNamesWithSuffix}${N}`;
        sql += `${T + T + T + T + T + T}FROM ${modelTableTree.name} as ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb${N}`;

        modelTableTree.middleTables.forEach((table) => {
            // middle table
            sql += `${T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.foreignKeyReferenceTableColumnName} = ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.${table.foreignKeyColumnName}${N}`;

            // middle table lists
            sql += `${T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.references[0].referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.referencedTable.references[0].foreignKeyColumnName} = ${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)}_tb.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName}`;
        });

        modelTableTree.references.forEach((table, index) => {
            // middle table
            if(modelTableTree.middleTables.length > 0 && index == 0)
                sql += N;

            if(index > 0){
                sql += N;
            }

            sql += `${T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.${table.foreignKeyColumnName} = ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.foreignKeyReferenceTableColumnName}`;
        });

        var tableIdType = modelTableTree.columns.find((row) => row.Field.toLowerCase() == 'id').Type;
        tableIdType = tableIdType.indexOf('int') > -1 ? 'int' : 'long';

        var methodContent = `${N + T + T}public async Task<${viewModelName}VM> getFullById(${tableIdType} ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}ID)${N}`;
        methodContent += `${T + T}{${N}`;
        methodContent += `${T + T + T}string sql = ${sql} WHERE ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.id = @${ValidateService.lowercaseFirstLetter(modelTableTree.name)}ID";${N + N}`;
        methodContent += `${T + T + T}var result = await _${ValidateService.lowercaseFirstLetter(viewModelName)}Query(sql, new { ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}ID = ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}ID});${N}`;
        methodContent += `${T + T + T}return result.Distinct().FirstOrDefault();${N}`;
        methodContent += `${T + T}}${N}`;

        return methodContent;
    }

    createGetFullHelperTemplate(viewModelName: string, modelTableTree: TableTree): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var methodContent = `${N + T + T}private async Task<IEnumerable<${viewModelName}VM>> _${ValidateService.lowercaseFirstLetter(viewModelName)}Query(string sql, object param)${N + T + T}{${N}`;

        var modelsNamesFirstLetterUpper = modelTableTree.references.map(table => ValidateService.capitalizeFirstLetter(table.referencedTable.name)).join(',');
        var modelNamesFirstLetterUpperSeparator = modelsNamesFirstLetterUpper.length > 0 ? ', ' : '';
       
        var modelListFirstLetterUpper = modelTableTree.middleTables.map((middletable) => ValidateService.capitalizeFirstLetter(middletable.referencedTable.references[0].referencedTable.name)).join(',');
        var modelListFirstLetterUpperSeparator = modelListFirstLetterUpper.length > 0 ? ', ' : '';

        var modelListFirstLetterLower = modelTableTree.middleTables.map((middletable) => ValidateService.lowercaseFirstLetter(middletable.referencedTable.references[0].referencedTable.name)).join(',');

        var modelsNamesFirstLetterLower = modelTableTree.references.map(table => ValidateService.lowercaseFirstLetter(table.referencedTable.name)).join(',');
        var modelNamesFirstLetterLowerSeparator = modelListFirstLetterLower.length > 0 ? ', ' : '';

        methodContent += `${T + T + T}using (IDbConnection conn = Connection)${N +
            T + T + T}{${N +
            T + T + T + T} var helperDictionary = new Dictionary<long, ${viewModelName}VM>();${N + N +
            T + T + T + T}return await conn.QueryAsync<${ValidateService.capitalizeFirstLetter(modelTableTree.name)}, ${modelsNamesFirstLetterUpper}${modelNamesFirstLetterUpperSeparator}${modelListFirstLetterUpper}${modelListFirstLetterUpperSeparator}${viewModelName}VM>(sql, (${ValidateService.lowercaseFirstLetter(modelTableTree.name)}, ${modelsNamesFirstLetterLower}${modelNamesFirstLetterLowerSeparator}${modelListFirstLetterLower}) =>${N +
            T + T + T + T}{${N +
            T + T + T + T + T}${viewModelName}VM returnModel;${N + N +
            T + T + T + T + T}if (!helperDictionary.TryGetValue(${ValidateService.lowercaseFirstLetter(modelTableTree.name)}.id, out returnModel))${N +
            T + T + T + T + T}{${N +
            T + T + T + T + T + T}returnModel = ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}.ConvertTo<${viewModelName}VM>();${N}`;

        modelTableTree.references.forEach((table) => {
            methodContent += `${T + T + T + T + T + T}returnModel.${ValidateService.lowercaseFirstLetter(table.referencedTable.name)} = ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)};${N}`;
        });

        modelTableTree.middleTables.forEach((table) => {
            methodContent += `${T + T + T + T + T + T}returnModel.${pluralize.plural(ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name))} = new List<${ValidateService.capitalizeFirstLetter(table.referencedTable.references[0].referencedTable.name)}>();${N}`;
        });

        methodContent += `${T + T + T + T + T + T}helperDictionary.Add(returnModel.id, returnModel);${N}`;
        methodContent += `${T + T + T + T + T}}${N + N}`;

        modelTableTree.middleTables.forEach((table) => {
            methodContent += `${T + T + T + T + T}if(${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)} != null)${N}`;
            methodContent += `${T + T + T + T + T + T}returnModel.${pluralize.plural(ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name))}.Add(${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)});${N + N}`;
        });

        methodContent += `${T + T + T + T + T}return returnModel;${N}`;
        methodContent += `${T + T + T + T}}, param);${N}`;
        methodContent += `${T + T + T}}${N}`;
        methodContent += `${T + T}}${N}`;

        return methodContent;
    }

    private _createRepositoryInterfaceFileTemplate(className: string, modelName: string): string {
        return iRepositoryTemplate(this.config['Project']['name'], className, modelName);
    }

    private _createRepositoryFileTemplate(className: string, modelName: string): string {
        return repositoryTemplate(this.config['Project']['name'], className, modelName);
    }

}