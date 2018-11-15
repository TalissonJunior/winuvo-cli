import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import * as pluralize from 'pluralize';
import { BaseModule } from "../base.module";
import { ValidateService } from '../../services';
import { iRepositoryTemplate } from '../../schematics/templates/repository/interfaces';
import { repositoryTemplate } from '../../schematics/templates/repository/repositories';
import { TableTree } from '../../models/interfaces/table-tree';
import { Global } from '../../globals';

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

    createRepository(name: string, modelName: string, callback: BaseCallback, throwErrorIfExists = true, changeNameAndReferencesIfExists = true) {

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
            if (!throwErrorIfExists) {
                callback(this.response.setData('skip'));
            }
            else {
                callback(this.response.setError('Already exists repository interface', `Already exists a repository interface ${path.join(repositoryInterfacesPath, repositoryInterfaceExtension)}`));
            }
        }
        else if (fs.existsSync(path.join(repositoryPath, repositoryExtension))) {
            if (!throwErrorIfExists) {
                callback(this.response.setData('skip'));
            }
            else {
                callback(this.response.setError('Already exists repository', `Already exists a repository ${path.join(repositoryPath, repositoryExtension)}`));
            }
        }
        else {
            
            var repositoryFiles = this.getDirectoryFilesSync(repositoryPath);
            var repositoryInterfaceFiles = this.getDirectoryFilesSync(repositoryInterfacesPath);
            var repositoryContent, returnRepositoryName, repositoryInterfaceContent, returnInterfaceRepositoryName, re;

            for (let index = 0; index < repositoryFiles.length; index++) {
                
                var fileContent = fs.readFileSync(repositoryFiles[index], 'utf8');

                var modelFileName = this.schematics.getStringBetween(fileContent, 'BaseRepository<', '>');
                var repositoryName = this.schematics.getStringBetween(fileContent, 'class', ':').trim();
                
                if(modelFileName == modelName){
                    re = new RegExp(repositoryName, 'g');

                    if(changeNameAndReferencesIfExists){
                        repositoryContent = fileContent.replace(re, path.parse(repositoryExtension).name);
                        
                        Global.repositoryReferences.push({
                            oldReference: repositoryName,
                            newReference: path.parse(repositoryExtension).name
                        });

                       fs.unlinkSync(repositoryFiles[index]);
                    }
                    else{
                        returnRepositoryName = repositoryName;
                    }
                    break;                   
                }
            }

            for (let index = 0; index < repositoryInterfaceFiles.length; index++) {
                
                var fileInterfaceContent = fs.readFileSync(repositoryInterfaceFiles[index], 'utf8');

                var modelFileInterfaceName = this.schematics.getStringBetween(fileInterfaceContent, 'IBaseRepository<', '>');
                var repositoryInterfaceName = this.schematics.getStringBetween(fileInterfaceContent, 'interface', ':');
                
                if(repositoryInterfaceContent){
                    repositoryInterfaceContent = repositoryInterfaceContent.trim();
                }

                if(modelFileInterfaceName == modelName){
                    re = new RegExp(repositoryInterfaceName, 'g');

                    if(changeNameAndReferencesIfExists){
                        repositoryInterfaceContent = fileInterfaceContent.replace(re,' ' + path.parse(repositoryInterfaceExtension).name + '');
                        
                        fs.unlinkSync(repositoryInterfaceFiles[index]);
                    }
                    else{
                        returnInterfaceRepositoryName = repositoryInterfaceName;
                    }
                    break;                   
                }
            }
            
            if(returnRepositoryName){
                callback(this.response.setData(repositoryInterfaceName + 'update-business'));
                return;
            }

            if(!repositoryContent){
                repositoryContent = this._createRepositoryFileTemplate(name, modelName);
            }

            if(!repositoryInterfaceContent){
                repositoryInterfaceContent = this._createRepositoryInterfaceFileTemplate(name, modelName);
            }

            if (this.schematics.createFile(repositoryInterfacesPath, repositoryInterfaceContent, repositoryInterfaceExtension)) {

                if (this.schematics.createFile(repositoryPath, repositoryContent, repositoryExtension)) {

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
            if (repositoryFileData.indexOf(getAllByMethodName) < 0) {
                this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, getAllByTableMethodContent));
            }

            if (repositoryFileInterfaceData.indexOf(getAllByMethodName) < 0) {
                this.schematics.createFile(repositoryFileInterfacePath, this.schematics.addDataToClassBody(repositoryFileInterfaceData, getAllByTableInterfaceMethodContent));
            }

            // Delete all method
            repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');
            repositoryFileInterfaceData = fs.readFileSync(repositoryFileInterfacePath, 'utf8');

            if (repositoryFileData.indexOf(deleteAllByMethodName) < 0) {
                this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, deleteAllByTableMethodContent));
            }

            if (repositoryFileInterfaceData.indexOf(deleteAllByMethodName) < 0) {
                this.schematics.createFile(repositoryFileInterfacePath, this.schematics.addDataToClassBody(repositoryFileInterfaceData, deleteAllByTableInterfaceMethodContent));
            }

        });

        return true;
    }

    createGetFullAllTemplate(viewModelName: string, modelTableTree: TableTree): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line

        var tableNamesWithSuffix = modelTableTree.references.map(table => ' ' + ValidateService.getTheForeignKeyName(table.foreignKeyColumnName) + '_tb.*');
        var tableNamesWithSuffixSeparator = tableNamesWithSuffix.length > 0 ? ', ' : '';

        var tableListNamesWithSuffix = modelTableTree.middleTables.map(table => {
            var model = ' ' + ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name) + '_tb.*';

            // Avoid the model that will be inserted in a list to have the same name as object model name, this can cause some compilation issues
            if (tableNamesWithSuffix.find(tableName => tableName == model)) {
                return model.replace('_tb.*', '_tb_list.*');
            }

            return model;
        });

        // Create the sql
        var sql = `@"SELECT ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.*,${tableNamesWithSuffix.join(',')}${tableNamesWithSuffixSeparator}${tableListNamesWithSuffix.join(',')}${N}`;
        sql += `${T + T + T + T + T + T}FROM ${modelTableTree.name} as ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb`;

        modelTableTree.references.forEach((table) => {
            sql += `${N + T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.name} as ${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.${table.foreignKeyColumnName} = ${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)}_tb.${table.foreignKeyReferenceTableColumnName}`;
        });

        modelTableTree.middleTables.forEach((table) => {
            // middle table
            sql += `${N + T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.foreignKeyReferenceTableColumnName} = ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.${table.foreignKeyColumnName}${N}`;

            // Avoid the model that will be inserted in a list to have the same name as object model name, this can cause some compilation issues
            var duplicatedModel = modelTableTree.references.find((referencedTable) => ValidateService.getTheForeignKeyName(referencedTable.foreignKeyColumnName) == table.referencedTable.references[0].referencedTable.name);
            var suffix = '';
            if (duplicatedModel) {
                suffix = '_list';
            }

            // middle table lists
            sql += `${T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.references[0].referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)}_tb${suffix}${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.referencedTable.references[0].foreignKeyColumnName} = ${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)}_tb${suffix}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName}`;
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

        var tableNamesWithSuffix = modelTableTree.references.map(table => ' ' + ValidateService.getTheForeignKeyName(table.foreignKeyColumnName) + '_tb.*');
        var tableNamesWithSuffixSeparator = tableNamesWithSuffix.length > 0 ? ', ' : '';

        var tableListNamesWithSuffix = modelTableTree.middleTables.map(table => {
            var model = ' ' + ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name) + '_tb.*';

            // Avoid the model that will be inserted in a list to have the same name as object model name, this can cause some compilation issues
            if (tableNamesWithSuffix.find(tableName => tableName == model)) {
                return model.replace('_tb.*', '_tb_list.*');
            }

            return model;
        });

        // Create the sql
        var sql = `@"SELECT ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.*,${tableNamesWithSuffix.join(',')}${tableNamesWithSuffixSeparator}${tableListNamesWithSuffix.join(',')}${N}`;
        sql += `${T + T + T + T + T + T}FROM ${modelTableTree.name} as ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb`;

        modelTableTree.references.forEach((table) => {
            sql += `${N + T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.name} as ${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.${table.foreignKeyColumnName} = ${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)}_tb.${table.foreignKeyReferenceTableColumnName}`;
        });

        modelTableTree.middleTables.forEach((table) => {
            // middle table
            sql += `${N + T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.foreignKeyReferenceTableColumnName} = ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}_tb.${table.foreignKeyColumnName}${N}`;

            // Avoid the model that will be inserted in a list to have the same name as object model name, this can cause some compilation issues
            var duplicatedModel = modelTableTree.references.find((referencedTable) => ValidateService.getTheForeignKeyName(referencedTable.foreignKeyColumnName) == table.referencedTable.references[0].referencedTable.name);
            var suffix = '';
            if (duplicatedModel) {
                suffix = '_list';
            }

            // middle table lists
            sql += `${T + T + T + T + T + T}LEFT JOIN ${table.referencedTable.references[0].referencedTable.name} as ${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)}_tb${suffix}${N}`;
            sql += `${T + T + T + T + T + T}ON ${ValidateService.lowercaseFirstLetter(table.referencedTable.name)}_tb.${table.referencedTable.references[0].foreignKeyColumnName} = ${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)}_tb${suffix}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName}`;
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

        var modelsNamesFirstLetterUpper = modelTableTree.references.map(table => ValidateService.capitalizeFirstLetter(table.referencedTable.name));
        var modelNamesFirstLetterUpperSeparator = modelsNamesFirstLetterUpper.length > 0 ? ', ' : '';

        var modelListFirstLetterUpper = modelTableTree.middleTables.map((middletable) => ValidateService.capitalizeFirstLetter(middletable.referencedTable.references[0].referencedTable.name));
        var modelListFirstLetterUpperSeparator = modelListFirstLetterUpper.length > 0 ? ', ' : '';

        var modelsNamesFirstLetterLower = modelTableTree.references.map(table => ValidateService.getTheForeignKeyName(table.foreignKeyColumnName));
        var modelNamesFirstLetterLowerSeparator = modelsNamesFirstLetterLower.length > 0 ? ', ' : '';

        var modelListFirstLetterLower = modelTableTree.middleTables.map((middletable) => {
            var model = ValidateService.lowercaseFirstLetter(middletable.referencedTable.references[0].referencedTable.name);

            // Avoid the model that will be inserted in a list to have the same name as object model name, this can cause some compilation issues
            if (modelsNamesFirstLetterLower.find(modelName => modelName == model)) {
                return model + 'OfList';
            }

            return model;
        });

        var modelListFirstLetterLowerSeparator = modelListFirstLetterLower.length > 0 ? ', ' : '';

        methodContent += `${T + T + T}using (IDbConnection conn = Connection)${N +
            T + T + T}{${N +
            T + T + T + T} var helperDictionary = new Dictionary<long, ${viewModelName}VM>();${N + N +
            T + T + T + T}return await conn.QueryAsync<${ValidateService.capitalizeFirstLetter(modelTableTree.name)}, ${modelsNamesFirstLetterUpper.join("")}${modelNamesFirstLetterUpperSeparator}${modelListFirstLetterUpper.join("")}${modelListFirstLetterUpperSeparator}${viewModelName}VM>(sql, (${ValidateService.lowercaseFirstLetter(modelTableTree.name)}${modelNamesFirstLetterLowerSeparator}${modelsNamesFirstLetterLower.join("")}${modelListFirstLetterLowerSeparator}${modelListFirstLetterLower.join("")}) =>${N +
            T + T + T + T}{${N +
            T + T + T + T + T}${viewModelName}VM returnModel;${N + N +
            T + T + T + T + T}if (!helperDictionary.TryGetValue(${ValidateService.lowercaseFirstLetter(modelTableTree.name)}.id, out returnModel))${N +
            T + T + T + T + T}{${N +
            T + T + T + T + T + T}returnModel = ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}.ConvertTo<${viewModelName}VM>();${N}`;

        modelTableTree.references.forEach((table) => {
            methodContent += `${T + T + T + T + T + T}returnModel.${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)} = ${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)};${N}`;
        });

        modelTableTree.middleTables.forEach((table) => {
            methodContent += `${T + T + T + T + T + T}returnModel.${pluralize.plural(ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name))} = new List<${ValidateService.capitalizeFirstLetter(table.referencedTable.references[0].referencedTable.name)}>();${N}`;
        });

        methodContent += `${T + T + T + T + T + T}helperDictionary.Add(returnModel.id, returnModel);${N}`;
        methodContent += `${T + T + T + T + T}}${N + N}`;

        modelTableTree.middleTables.forEach((table) => {
            // Avoid the model that will be inserted in a list to have the same name as object model name, this can cause some compilation issues
            var duplicatedModel = modelTableTree.references.find((referencedTable) => ValidateService.getTheForeignKeyName(referencedTable.foreignKeyColumnName) == table.referencedTable.references[0].referencedTable.name);
            var listModelName = table.referencedTable.references[0].referencedTable.name;
            if (duplicatedModel) {
                listModelName = listModelName + 'OfList';
            }

            methodContent += `${T + T + T + T + T}if(${ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name)} != null)${N}`;
            methodContent += `${T + T + T + T + T + T}returnModel.${pluralize.plural(ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.name))}.Add(${ValidateService.lowercaseFirstLetter(listModelName)});${N + N}`;
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