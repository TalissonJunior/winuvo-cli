import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as pluralize from 'pluralize';
import { BaseModule } from "../base.module";
import { Schematics } from '../../schematics/schematics';
import { ValidateService } from '../../services';
import { businessTemplate } from '../../schematics/templates/business/rules';
import { iBusinessTemplate } from '../../schematics/templates/business/interfaces';
import { ModelModule } from '../model/model.module';
import { RepositoryModule } from '../repository/repository.module';
import { ModelFile } from '../../models/interfaces';
import { TableTree } from '../../models/interfaces/table-tree';
import { Global } from '../../globals';

export class BusinessModule extends BaseModule {
    schematics: Schematics;
    modelModule: ModelModule;
    repositoryModule: RepositoryModule;

    constructor(spinner?: ora) {
        super(spinner);
        this.schematics = new Schematics();
        this.modelModule = new ModelModule(spinner);
        this.repositoryModule = new RepositoryModule(spinner);
    }

    create(name: string, modelName: string, callback: BaseCallback, throwErrorIfExists = true): void {
        modelName = modelName.replace(/Business/g, '');

        var modelPath = path.join(process.cwd(), this.config['modelPath']['main']);
        var repositoryInterfacesPath = path.join(process.cwd(), this.config['repositoryPath']['interfaces']);
        var repositoryPath = path.join(process.cwd(), this.config['repositoryPath']['main']);
        var businessInterfacesPath = path.join(process.cwd(), this.config['businessPath']['interfaces']);
        var businessPath = path.join(process.cwd(), this.config['businessPath']['main']);

        var modelNameWithExtension = ValidateService.capitalizeFirstLetter(modelName) + this.config['modelPath']['suffixExtension'];
        var repositoryInterfaceExtension = 'I' + ValidateService.capitalizeFirstLetter(name) + this.config['repositoryPath']['suffixExtension'];
        var repositoryNameWithExtension = ValidateService.capitalizeFirstLetter(name) + this.config['repositoryPath']['suffixExtension'];
        var businessInterfaceExtension = 'I' + ValidateService.capitalizeFirstLetter(name) + this.config['businessPath']['suffixExtension'];
        var businessNameWithExtension = ValidateService.capitalizeFirstLetter(name) + this.config['businessPath']['suffixExtension'];

        if (!fs.existsSync(path.join(modelPath, modelNameWithExtension))) {
            callback(this.response.setError('Couldn´t find model', `Coudn´t find a model with the name ${modelName} at ${path.join(modelPath, modelNameWithExtension)}`));
        }
        else if (!fs.existsSync(path.join(repositoryInterfacesPath, repositoryInterfaceExtension))) {
            callback(this.response.setError('Couldn´t find repository interface', `Coudn´t find a repository interface with the name ${repositoryInterfaceExtension} at ${path.join(repositoryInterfacesPath, repositoryInterfaceExtension)}`));
        }
        else if (!fs.existsSync(path.join(repositoryPath, repositoryNameWithExtension))) {
            callback(this.response.setError('Couldn´t find repository', `Coudn´t find a repository interface with the name ${repositoryNameWithExtension} at ${path.join(repositoryPath, repositoryNameWithExtension)}`));
        }
        else if (fs.existsSync(path.join(businessInterfacesPath, businessInterfaceExtension))) {
            if (!throwErrorIfExists) {
                callback(this.response.setData('skip'));
            }
            else {
                callback(this.response.setError('Already exists business interface', `Already exists a business interface ${path.join(businessInterfacesPath, businessInterfaceExtension)}`));
            }
        }
        else if (fs.existsSync(path.join(businessPath, businessNameWithExtension))) {
            if (!throwErrorIfExists) {
                callback(this.response.setData('skip'));
            }
            else {
                callback(this.response.setError('Already exists business', `Already exists a business ${path.join(businessPath, businessNameWithExtension)}`));
            }
        }
        else {
            if (this.schematics.createFile(businessInterfacesPath, this._createBusinessInterfaceFileTemplate(name, modelName), businessInterfaceExtension)) {

                if (this.schematics.createFile(businessPath, this._createBusinessFileTemplate(name, modelName), businessNameWithExtension)) {

                    this.addStartupService(businessInterfaceExtension, businessNameWithExtension, (startupResponse) => {
                        var response = '';
                        if (startupResponse.data) {
                            var logStartup = startupResponse.data == true ? '' : '\n' + startupResponse.data;
                            response = `<create/> ${path.join(businessInterfacesPath, businessInterfaceExtension)}\n<create/> ${path.join(businessPath, businessNameWithExtension)}` + logStartup;
                        }
                        else {
                            response = `<create/> ${path.join(businessInterfacesPath, businessInterfaceExtension)}\n<create/> ${path.join(businessPath, businessNameWithExtension)}`;
                        }

                        this._generateFullMethods(businessNameWithExtension, modelName, name, () => {
                            callback(this.response.setData(response));
                        });
                    });
                }
                else {
                    callback(this.response.setError('Fail to create business', ' Could not create the business'));
                }
            }
            else {
                callback(this.response.setError('Fail to create business interface', ' Could not create the business interface'));
            }
        }
    }

    private _createBusinessInterfaceFileTemplate(className: string, modelName: string): string {
        return iBusinessTemplate(this.config['Project']['name'], className, modelName);
    }

    private _createBusinessFileTemplate(className: string, modelName: string): string {
        return businessTemplate(this.config['Project']['name'], className, modelName);
    }

    private _generateFullMethods(fileNameWithExtension: string, modelName: string, fileName: string, callback: BaseCallback) {

        this.database.connect(null, (response) => {
            this.modelModule.database.tablesTree = _.cloneDeep(this.database.tablesTree);

            if (response.data) {
                var tableName = this.modelModule.getTableNameFromModel(modelName);
                var modelTableTree = this.database.tablesTree.find((table) => table.name == tableName);

                if (!tableName) {
                    callback(this.response.setError('Fail to generate insert full method', `Couldn´t find a table name inside '[Table("your-table-name")] for model ${modelName}`));
                }
                if (!modelTableTree) {
                    callback(this.response.setError('Fail to generate insert full method', `Couldn´t find a table in database that references to the table [Table("${tableName}")] inside model ${modelName}`));
                }
                else {
                    var models = modelTableTree.references.map((table) => table.referencedTable.name); // holds the models that aren´t list
                    var modelsToGenerate = _.clone(models);  // holds all kind of models
                    var modelsList = []; // Holds the models that are list

                    modelTableTree.middleTables.forEach((modelTable) => {
                        modelsToGenerate.push(modelTable.referencedTable.name);
                        modelsList = modelTable.referencedTable.references.map((referenceTable) => referenceTable.referencedTable.name);
                        modelsToGenerate = modelsToGenerate.concat(_.clone(modelsList));
                    });

                    // Remove duplicates
                    modelsToGenerate = _.uniqBy(modelsToGenerate, (model) => model);

                    if (models.length > 0 || modelsList.length > 0) {

                        // Creating the models that doesn´t exits
                        this.modelModule.createModelBasedOnTableNames(modelsToGenerate, (modelResponse) => {
                            var modelsGenerated = _.cloneDeep(modelResponse);

                            if (modelResponse.data) {

                                // Creating the ViewModel;
                                var viewModelName = ValidateService.transformStringToCamelCase(tableName + '_' + modelTableTree.references.map((table) => ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)).join('_') + '_' + modelsList.join('_'));

                                this.modelModule.createViewModel(viewModelName, modelTableTree, () => {

                                    var repositoryPromises = [];

                                    // Creating repositories
                                    modelsGenerated.data.forEach((model: ModelFile) => {

                                        var promise = new Promise((resolve, reject) => {
                                            this.repositoryModule.createRepository(model.modelName, model.modelName, (createRepositoryResponse) => {
                                                resolve(createRepositoryResponse.data);
                                            }, false, false);
                                        });

                                        repositoryPromises.push(promise);
                                    });

                                    Promise.all(repositoryPromises).then(() => {
                                        modelTableTree = this.updateModelTree(modelTableTree);

                                        var businessInsertFullTemplate = this._generateInsertFullTemplate(viewModelName, modelTableTree);
                                        var businessInsertFullInterfaceTemplate = this._generateInsertFullInterfaceTemplate(viewModelName);
                                        var businessInsertFullAllTemplate = this._generateInsertFullAllTemplate(viewModelName);
                                        var businessInsertFullAllInterfaceTemplate = this._generateInsertFullAllInterfaceTemplate(viewModelName);
                                        var businessGetFullAllTemplate = this._generateGetFullAllTemplate();
                                        var businessGetFullAllInterfaceTemplate = this._generateGetFullAllInterfaceTemplate();
                                        var businessGetFullByIdTemplate = this._generateGetFullByIDTemplate(modelTableTree);
                                        var businessGetFullByIdInterfaceTemplate = this._generateGetFullByIdInterfaceTemplate(modelTableTree);
                                        var businessEditFullTemplate = this._generateEditFullTemplate(viewModelName, modelTableTree);
                                        var businessEditFullInterfaceTemplate = this._generateEditFullInterfaceTemplate(viewModelName);
                                        var businessEditFullAllTemplate = this._generateEditFullAllTemplate(viewModelName);
                                        var businessEditFullAllInterfaceTemplate = this._generateEditFullAllInterfaceTemplate(viewModelName);

                                        var repositoryGetFullAllHelperTemplate = this.repositoryModule.createGetFullHelperTemplate(viewModelName, modelTableTree);
                                        var repositoryGetFullAllTemplate = this.repositoryModule.createGetFullAllTemplate(viewModelName, modelTableTree);
                                        var repositoryGetFullByIdTemplate = this.repositoryModule.createGetFullByIdTemplate(viewModelName, modelTableTree);
                                        var repositoryGetFullAllInterfaceTemplate = this.repositoryModule.createGetFullAllInterfaceTemplate(viewModelName);
                                        var repositortGetFullByIdInterfaceTemplate = this.repositoryModule.createGetFullByIdInterfaceTemplate(viewModelName, modelTableTree);

                                        var businessFilePath = path.join(process.cwd(), this.config['businessPath']['main'], fileNameWithExtension);
                                        var businessFileInterfacePath = path.join(process.cwd(), this.config['businessPath']['interfaces'], 'I' + fileNameWithExtension);
                                        var repositoryFilePath = path.join(process.cwd(), this.config['repositoryPath']['main'], ValidateService.capitalizeFirstLetter(fileName) + this.config['repositoryPath']['suffixExtension']);
                                        var repositoryFileInterfacePath = path.join(process.cwd(), this.config['repositoryPath']['interfaces'], 'I' + ValidateService.capitalizeFirstLetter(fileName) + this.config['repositoryPath']['suffixExtension']);

                                        var businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        var businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');
                                        var repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');
                                        var repositoryFileInterfaceData = fs.readFileSync(repositoryFileInterfacePath, 'utf8');

                                        // Create middle table Methods
                                        this.repositoryModule.createMiddleTableMethodsTemplate(modelTableTree);

                                        // Get Full All Repository
                                        if (repositoryFileData.indexOf(repositoryGetFullAllTemplate) < 0) {
                                            this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, repositoryGetFullAllTemplate));
                                        }
                                        if (repositoryFileInterfaceData.indexOf(repositoryGetFullAllInterfaceTemplate) < 0) {
                                            this.schematics.createFile(repositoryFileInterfacePath, this.schematics.addDataToClassBody(repositoryFileInterfaceData, repositoryGetFullAllInterfaceTemplate));
                                        }

                                        // Get Full By ID Repository
                                        repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');
                                        repositoryFileInterfaceData = fs.readFileSync(repositoryFileInterfacePath, 'utf8');

                                        if (repositoryFileData.indexOf(repositoryGetFullByIdTemplate) < 0) {
                                            this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, repositoryGetFullByIdTemplate));
                                        }
                                        if (repositoryFileInterfaceData.indexOf(repositortGetFullByIdInterfaceTemplate) < 0) {
                                            this.schematics.createFile(repositoryFileInterfacePath, this.schematics.addDataToClassBody(repositoryFileInterfaceData, repositortGetFullByIdInterfaceTemplate));
                                        }

                                        // Get Full All Helper Repository
                                        repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');

                                        if (repositoryFileData.indexOf(repositoryGetFullAllHelperTemplate) < 0) {
                                            this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, repositoryGetFullAllHelperTemplate));
                                        }

                                        // Get Full All Business
                                        if (businessFileData.indexOf(businessGetFullAllTemplate) < 0) {
                                            this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessGetFullAllTemplate));
                                        }
                                        if (businessFileInterfaceData.indexOf(businessGetFullAllInterfaceTemplate) < 0) {
                                            this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessGetFullAllInterfaceTemplate));
                                        }

                                        // Get Full By ID Business 
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');

                                        if (businessFileData.indexOf(businessGetFullByIdTemplate) < 0) {
                                            this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessGetFullByIdTemplate));
                                        }
                                        if (businessFileInterfaceData.indexOf(businessGetFullByIdInterfaceTemplate) < 0) {
                                            this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessGetFullByIdInterfaceTemplate));
                                        }

                                        // Insert Full Business
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');

                                        if (businessFileData.indexOf(businessInsertFullTemplate) < 0) {
                                            this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessInsertFullTemplate));
                                        }
                                        if (businessFileInterfaceData.indexOf(businessInsertFullInterfaceTemplate) < 0) {
                                            this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessInsertFullInterfaceTemplate));
                                        }

                                        // Insert Full All Business
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');

                                        if (businessFileData.indexOf(businessInsertFullAllTemplate) < 0) {
                                            this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessInsertFullAllTemplate));
                                        }
                                        if (businessFileInterfaceData.indexOf(businessInsertFullAllInterfaceTemplate) < 0) {
                                            this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessInsertFullAllInterfaceTemplate));
                                        }

                                        // Edit Full Business
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');

                                        if (businessFileData.indexOf(businessEditFullTemplate) < 0) {
                                            this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessEditFullTemplate));
                                        }
                                        if (businessFileInterfaceData.indexOf(businessEditFullInterfaceTemplate) < 0) {
                                            this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessEditFullInterfaceTemplate));
                                        }

                                        // Edit Full All Business
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');

                                        if (businessFileData.indexOf(businessEditFullAllTemplate) < 0) {
                                            this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessEditFullAllTemplate));
                                        }
                                        if (businessFileInterfaceData.indexOf(businessEditFullAllInterfaceTemplate) < 0) {
                                            this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessEditFullAllInterfaceTemplate));
                                        }

                                        if(Global.repositoryReferences.length > 0){
                                            this.updateBusinessReference(Global.repositoryReferences);
                                            this.updateServices(Global.repositoryReferences);
                                            Global.repositoryReferences = [];
                                        }

                                        callback(this.response.setData(true));
                                    });
                                });

                            }
                            else {
                                callback(modelResponse);
                            }
                        });
                    }
                    else {
                        callback(this.response.setData(true));
                    }
                }
            }
            else {
                callback(response);
            }
        });
    }

    updateServices(references: Array<any>) {

        var startupPath = path.join(process.cwd(), 'Startup.cs');
        var startupFileData = fs.readFileSync(startupPath, 'utf8');

        references.forEach((reference) => {
            startupFileData = this.schematics.removeLineByKeyword(startupFileData, 'services.AddTransient<I' + reference.oldReference);
        });

        this.schematics.createFile(startupPath,startupFileData);
    }

    updateBusinessReference(references: Array<any>) {
        var businessPath = path.join(process.cwd(), this.config['businessPath']['main']);

        var businessFiles = this.getDirectoryFilesSync(businessPath);
        businessFiles = businessFiles.filter((filePath) => filePath.toLowerCase().indexOf('basebusiness') < 0);

        for (let index = 0; index < businessFiles.length; index++) {
           
            var businessFileData = fs.readFileSync(businessFiles[index], 'utf8');
            
            references.forEach((reference) => {
                var reg;
                reg = new RegExp('\\b_' + ValidateService.lowercaseFirstLetter(reference.oldReference)+ '\\b', 'gi');
                businessFileData = businessFileData.replace(reg, '_' + ValidateService.lowercaseFirstLetter(reference.newReference));

                reg = new RegExp('\\b' + ValidateService.capitalizeFirstLetter(reference.oldReference)+ '\\b', 'gi');
                businessFileData = businessFileData.replace(reg, ValidateService.capitalizeFirstLetter(reference.newReference));
            });

            this.schematics.createFile(businessFiles[index],businessFileData);
        }
    }

    updateModelTree(modelTableTree: TableTree): TableTree {
        var modelName;

        var modelFilesPath = path.join(process.cwd(), this.config['modelPath']['main']);
        var repositoriesPath = path.join(process.cwd(), this.config['repositoryPath']['main']);

        var modelFiles = this.getDirectoryFilesSync(modelFilesPath);
        var repositoryFiles = this.getDirectoryFilesSync(repositoriesPath);
        modelFiles = modelFiles.filter((filePath) => filePath.toLowerCase().indexOf('modelhandler') < 0);

        // Get models
        for (let index = 0; index < modelFiles.length; index++) {

            var modelFileData = fs.readFileSync(modelFiles[index], 'utf8');

            var tableName = this.schematics.getStringBetween(modelFileData, '[Table("', '")]');
            modelName = this.schematics.getStringAfter(modelFileData, 'public class');

            if(modelTableTree.name.toLowerCase() == tableName.trim().toLowerCase()){
                modelTableTree.modelName = modelName.trim();
            }
            else {
                modelTableTree.references.forEach((table) => {
                     if(table.referencedTable.name.toLowerCase() == tableName.trim().toLowerCase()){
                        table.referencedTable.modelName = modelName.trim();
                     }
                });

                modelTableTree.middleTables.forEach((table) => {
                    if(table.referencedTable.name.toLowerCase() == tableName.trim().toLowerCase()){
                        table.referencedTable.modelName = modelName.trim();
                    }

                    if(table.referencedTable.references[0].referencedTable.name.toLowerCase() == tableName.trim().toLowerCase()){
                        table.referencedTable.references[0].referencedTable.modelName = modelName.trim();
                     }
               });
            }
        }

        // Get repositories
        for (let index = 0; index < repositoryFiles.length; index++) {

            var repositoryFileData = fs.readFileSync(repositoryFiles[index], 'utf8');

            modelName = this.schematics.getStringBetween(repositoryFileData, 'BaseRepository<', '>');
            var repositoryName = this.schematics.getStringBetween(repositoryFileData, 'public class', ':');

            if(modelTableTree.modelName && modelTableTree.modelName.toLowerCase() == modelName.trim().toLowerCase()){
                modelTableTree.repositoryName = repositoryName.trim();
            }
            else {
                modelTableTree.references.forEach((table) => {
                     if(table.referencedTable.modelName && table.referencedTable.modelName.toLowerCase() == modelName.trim().toLowerCase()){
                        table.referencedTable.repositoryName = repositoryName.trim();
                     }
                });

                modelTableTree.middleTables.forEach((table) => {
                    if(table.referencedTable.modelName && table.referencedTable.modelName.toLowerCase() == modelName.trim().toLowerCase()){
                        table.referencedTable.repositoryName = repositoryName.trim();
                    }

                    if(table.referencedTable.references[0].referencedTable.modelName && table.referencedTable.references[0].referencedTable.modelName.toLowerCase() == modelName.trim().toLowerCase()){
                        table.referencedTable.references[0].referencedTable.repositoryName = repositoryName.trim();
                     }
               });
            }
        }

        return modelTableTree;
    }

    private _generateGetFullAllTemplate(): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        return `${T + T}public BaseResponse getAllFull()${N +
            T + T}{${N +
            T + T + T}try${N +
            T + T + T}{${N +
            T + T + T + T}return _baseResponse.setData(_repository.getAllFull().Result);${N +
            T + T + T}}${N +
            T + T + T}catch (Exception e)${N +
            T + T + T}{${N +
            T + T + T + T}return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, e.Message);${N +
            T + T + T}}${N +
            T + T}}${N}`;
    }

    private _generateGetFullByIDTemplate(modelTableTree: TableTree): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line

        var tableIdType = modelTableTree.columns.find((row) => row.Field.toLowerCase() == 'id').Type;
        tableIdType = tableIdType.indexOf('int') > -1 ? 'int' : 'long';

        return `${T + T}public BaseResponse getFullById(${tableIdType} ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}ID)${N +
            T + T}{${N +
            T + T + T}try${N +
            T + T + T}{${N +
            T + T + T + T}return _baseResponse.setData(_repository.getFullById(${ValidateService.lowercaseFirstLetter(modelTableTree.name)}ID).Result);${N +
            T + T + T}}${N +
            T + T + T}catch (Exception e)${N +
            T + T + T}{${N +
            T + T + T + T}return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, e.Message);${N +
            T + T + T}}${N +
            T + T}}${N}`;
    }

    private _generateGetFullAllInterfaceTemplate(): string {
        const T = "\t"; //Tab line
        return `${T + T} BaseResponse getAllFull();`;
    }

    private _generateGetFullByIdInterfaceTemplate(modelTableTree: TableTree): string {
        const T = "\t"; //Tab line

        var tableIdType = modelTableTree.columns.find((row) => row.Field.toLowerCase() == 'id').Type;
        tableIdType = tableIdType.indexOf('int') > -1 ? 'int' : 'long';

        return `${T + T} BaseResponse getFullById(${tableIdType} ${ValidateService.lowercaseFirstLetter(modelTableTree.name)}ID);`;
    }

    private _generateInsertFullInterfaceTemplate(viewModelName: string): string {
        const T = "\t"; //Tab line
        return `${T + T} BaseResponse insertFull(${viewModelName}VM model);`;
    }

    private _generateInsertFullTemplate(viewModelName: string, modelTableTree: TableTree): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var methodContent = `${T + T}public BaseResponse insertFull(${viewModelName}VM model) ${N + T + T}{${N}`;

        // Models object
        modelTableTree.references.forEach((table) => {
            var repositoryNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.repositoryName) || ValidateService.capitalizeFirstLetter(table.referencedTable.name) + 'Repository';
            var repositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(table.referencedTable.name) + 'Repository';

            methodContent += `${T + T + T}${repositoryNameUpper} _${repositoryNameLower} = new ${repositoryNameUpper}(_configuration);${N}`;
        });

        // Middle tables object
        modelTableTree.middleTables.forEach((table) => {
            var middleTableRepositoryNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.repositoryName) || ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name)) + 'Repository';
            var middleTableRepositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name)) + 'Repository';
            var listRepositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name)) + 'Repository';
            var listRepositoryNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.references[0].referencedTable.repositoryName) || ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name)) + 'Repository';
            var listModelNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.references[0].referencedTable.modelName) || ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name));

            var initialization = `${T + T + T}${middleTableRepositoryNameUpper} _${middleTableRepositoryNameLower} = new ${middleTableRepositoryNameUpper}(_configuration);${N}`;

            if (methodContent.indexOf(initialization) < 0) {
                methodContent += initialization;
            }

            initialization = `${T + T + T}${listRepositoryNameUpper} _${listRepositoryNameLower} = new ${listRepositoryNameUpper}(_configuration);${N}`;

            if (methodContent.indexOf(initialization) < 0) {
                methodContent += initialization;
            }

            initialization = `${T + T + T}IEnumerable<${listModelNameUpper}> list${listModelNameUpper} = _${listRepositoryNameLower}.getAll();${N}`;

            if (methodContent.indexOf(initialization) < 0) {
                methodContent += initialization;
            }
        });

        methodContent += `${N + T + T + T}try ${N + T + T + T}{${N}`;

        // Models object
        modelTableTree.references.forEach((table) => {
            var repositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name)) + 'Repository';

            var foreignKeyField = modelTableTree.columns.find(row => row.Field == table.foreignKeyReferenceTableColumnName);
            var castType = foreignKeyField.Type.indexOf('long') > -1 ? '' : '(int)';

            methodContent += `${T + T + T + T}model.${table.foreignKeyColumnName} = model.${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)}.${table.foreignKeyReferenceTableColumnName} > 0 ? model.${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)}.${table.foreignKeyReferenceTableColumnName} : ${castType}_${repositoryNameLower}.insert(model.${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)});${N}`;
        });

        if (modelTableTree.references.length > 0) {
            methodContent += N;
        }

        if (modelTableTree.middleTables.length > 0) {
            methodContent += `${T + T + T + T}long id = _repository.insert(model.ConvertTo<${modelTableTree.modelName || ValidateService.transformStringToCamelCase(modelTableTree.name)}>());${N + N}`;
        }
        else {
            methodContent += `${T + T + T + T}_repository.insert(model.ConvertTo<${modelTableTree.modelName || ValidateService.transformStringToCamelCase(modelTableTree.name)}>());${N + N}`;
        }

        // Models List
        modelTableTree.middleTables.forEach((table) => {
            var middleTableRepositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name)) + 'Repository';
            var middleTableModelNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.modelName) || ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name));
            var middleTableModelNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.modelName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name));
            var listRepositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name)) + 'Repository';
            var listModelNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.modelName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name));
            var listModelNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.references[0].referencedTable.modelName) || ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name));


            var middleTableForeignKeyField = table.referencedTable.columns.find(row => row.Field == table.foreignKeyReferenceTableColumnName);
            var middleTableCastType = middleTableForeignKeyField.Type.indexOf('long') > -1 ? '' : '(int)';

            var middleTableChildForeignKeyField = table.referencedTable.columns.find(row => row.Field == table.referencedTable.references[0].foreignKeyColumnName);
            var middleTableChildCastType = middleTableChildForeignKeyField.Type.indexOf('long') > -1 ? '' : '(int)';

            methodContent += `${T + T + T + T}List<${middleTableModelNameUpper}> list${middleTableModelNameUpper} = new List<${middleTableModelNameUpper}>();${N}`;

            methodContent += `${T + T + T + T}model.${pluralize.plural(listModelNameLower)}.ForEach((${listModelNameLower}) => ${N +
                T + T + T + T}{${N}`;

            methodContent += `${T + T + T + T + T}${middleTableModelNameUpper} ${middleTableModelNameLower} = new ${middleTableModelNameUpper}();${N}`;
            methodContent += `${T + T + T + T + T}${middleTableModelNameLower}.${table.foreignKeyReferenceTableColumnName} = ${middleTableCastType}id;${N}`;

            methodContent += `${T + T + T + T + T}if(${listModelNameLower}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName} > 0) ${middleTableModelNameLower}.${table.referencedTable.references[0].foreignKeyColumnName} = ${listModelNameLower}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName};${N}`;
            methodContent += `${T + T + T + T + T}else${N + T + T + T + T + T}{${N}`;

            methodContent += `${T + T + T + T + T + T}${listModelNameUpper} aux${listModelNameUpper} = list${listModelNameUpper}.ToList().Find(x => x.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName} == ${listModelNameLower}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName});${N}`;
            methodContent += `${T + T + T + T + T + T}${middleTableModelNameLower}.${table.referencedTable.references[0].foreignKeyColumnName} = aux${listModelNameUpper} != null ? aux${listModelNameUpper}.id : ${middleTableChildCastType}_${listRepositoryNameLower}.insert(${listModelNameLower});${N}`;
            methodContent += `${T + T + T + T + T}}${N + N}`;

            methodContent += `${T + T + T + T + T}list${middleTableModelNameUpper}.Add(${middleTableModelNameLower});${N}`;
            methodContent += `${T + T + T + T}});${N + N}`;

            methodContent += `${T + T + T + T}_${middleTableRepositoryNameLower}.insert(list${middleTableModelNameUpper});${N + N}`;
        });

        methodContent += `${T + T + T + T}return _baseResponse.setData(true);${N}`;
        methodContent += `${T + T + T}}${N}`;
        methodContent += `${T + T + T}catch (Exception e)${N}`;
        methodContent += `${T + T + T}{${N}`;
        methodContent += `${T + T + T + T}return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, e.Message);${N}`;
        methodContent += `${T + T + T}}${N}`;

        methodContent += `${T + T}}${N}`;

        return methodContent;
    }

    private _generateInsertFullAllInterfaceTemplate(viewModelName: string): string {
        const T = "\t"; //Tab line
        return `${T + T} BaseResponse insertFullAll(List<${viewModelName}VM> models);`;
    }

    private _generateInsertFullAllTemplate(viewModelName: string): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var template = `${T + T}public BaseResponse insertFullAll(List<${viewModelName}VM> models)${N}`;

        template += `${T + T}{${N +
            T + T + T}try${N +
            T + T + T}{${N +
            T + T + T + T}models.ForEach(model =>${N +
            T + T + T + T}{${N +
            T + T + T + T + T}insertFull(model);${N +
            T + T + T + T}});${N +
            T + T + T + T}return _baseResponse.setData(true);${N +
            T + T + T}}${N +
            T + T + T}catch (Exception e)${N +
            T + T + T}{${N +
            T + T + T + T}return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, e.Message);${N +
            T + T + T}}${N +
            T + T}}`;

        return template;
    }

    private _generateEditFullInterfaceTemplate(viewModelName: string): string {
        const T = "\t"; //Tab line
        return `${T + T} BaseResponse editFull(${viewModelName}VM model);`;
    }

    private _generateEditFullTemplate(viewModelName: string, modelTableTree: TableTree): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var methodContent = `${N + T + T}public BaseResponse editFull(${viewModelName}VM model) ${N + T + T}{${N}`;

        // Models object
        modelTableTree.references.forEach((table) => {
            var repositoryNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.repositoryName) || ValidateService.capitalizeFirstLetter(table.referencedTable.name) + 'Repository';
            var repositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(table.referencedTable.name) + 'Repository';

            methodContent += `${T + T + T}${repositoryNameUpper} _${repositoryNameLower} = new ${repositoryNameUpper}(_configuration);${N}`;
        });

        // Middle tables object
        modelTableTree.middleTables.forEach((table) => {
            var middleTableRepositoryNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.repositoryName) || ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name)) + 'Repository';
            var middleTableRepositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name)) + 'Repository';
            var listRepositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name)) + 'Repository';
            var listRepositoryNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.references[0].referencedTable.repositoryName) || ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name)) + 'Repository';

            var initialization = `${T + T + T}${middleTableRepositoryNameUpper} _${middleTableRepositoryNameLower} = new ${middleTableRepositoryNameUpper}(_configuration);${N}`;

            if (methodContent.indexOf(initialization) < 0) {
                methodContent += initialization;
            }
            
            initialization = `${T + T + T}${listRepositoryNameUpper} _${listRepositoryNameLower} = new ${listRepositoryNameUpper}(_configuration);${N}`;

            if (methodContent.indexOf(initialization) < 0) {
                methodContent += initialization;
            }
        });

        methodContent += `${N + T + T + T}try ${N + T + T + T}{${N}`;

        // Models object
        modelTableTree.references.forEach((table) => {
            var repositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(table.referencedTable.name) + 'Repository';

            methodContent += `${T + T + T + T}if (model.${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)}.id > 0){${N}`;
            methodContent += `${T + T + T + T + T} _${repositoryNameLower}.update(model.${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)});${N}`;
            methodContent += `${T + T + T + T}}${N}`;
            methodContent += `${T + T + T + T}else {${N}`;
            methodContent += `${T + T + T + T + T} _${repositoryNameLower}.insert(model.${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)});${N}`;
            methodContent += `${T + T + T + T}}${N + N}`;

            methodContent += `${T + T + T + T}model.${table.foreignKeyColumnName} = model.${ValidateService.getTheForeignKeyName(table.foreignKeyColumnName)}.${table.foreignKeyReferenceTableColumnName};${N}`;
        });

        methodContent += `${T + T + T + T}_repository.update(model.ConvertTo<${modelTableTree.modelName || ValidateService.capitalizeFirstLetter(modelTableTree.name)}>());${N + N}`;

        // List tables object
        modelTableTree.middleTables.forEach((table) => {
            var middleTableRepositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name)) + 'Repository';
            var middleTableModelNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.modelName) || ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name));
            var middleTableModelNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.modelName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name));
            var listModelNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.modelName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name));
            var listRepositoryNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.references[0].referencedTable.repositoryName) || ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name)) + 'Repository';

            methodContent += `${T + T + T + T}if (model.${pluralize.plural(listModelNameLower)}.Count > 0)${N}`;
            methodContent += `${T + T + T + T}{${N}`;
            methodContent += `${T + T + T + T + T}List<${middleTableModelNameUpper}> list${middleTableModelNameUpper} = _${middleTableRepositoryNameLower}.getAllBy${modelTableTree.modelName || ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id(model.id);${N}`;
            methodContent += `${T + T + T + T + T}if(list${middleTableModelNameUpper}.Count > 0) {${N}`;
            methodContent += `${T + T + T + T + T + T}List<${middleTableModelNameUpper}> list${middleTableModelNameUpper}ToDelete = list${middleTableModelNameUpper}.Where((${middleTableModelNameLower}) => model.${pluralize.plural(listModelNameLower)}.Select((${listModelNameLower}) => ${listModelNameLower}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName} != ${middleTableModelNameLower}.${table.referencedTable.references[0].foreignKeyColumnName}) != null).ToList();${N}`;
            methodContent += `${T + T + T + T + T + T}_${middleTableRepositoryNameLower}.delete(list${middleTableModelNameUpper}ToDelete);${N}`;
            methodContent += `${T + T + T + T + T}}${N + N}`;

            methodContent += `${T + T + T + T + T}model.${pluralize.plural(listModelNameLower)}.ForEach((${listModelNameLower}) => {${N + N}`;
            methodContent += `${T + T + T + T + T + T}if(${listModelNameLower}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName} == 0) {${N}`;
            methodContent += `${T + T + T + T + T + T + T}_${listRepositoryNameLower}.insert(${listModelNameLower});${N}`;
            methodContent += `${T + T + T + T + T + T}}${N + N}`;

            methodContent += `${T + T + T + T + T + T}${middleTableModelNameUpper} ${middleTableModelNameLower} = new ${middleTableModelNameUpper}() {${N}`;
            methodContent += `${T + T + T + T + T + T + T}${table.referencedTable.references[0].foreignKeyColumnName} = ${table.referencedTable.references[0].referencedTable.name}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName},${N}`;
            methodContent += `${T + T + T + T + T + T + T}${table.foreignKeyReferenceTableColumnName} = model.${table.foreignKeyColumnName}${N}`;
            methodContent += `${T + T + T + T + T + T}};${N + N}`;

            methodContent += `${T + T + T + T + T + T}_${middleTableRepositoryNameLower}.insert(${middleTableModelNameLower});${N}`;
            methodContent += `${T + T + T + T + T}});${N + N}`;

            methodContent += `${T + T + T + T}}${N}`;
            methodContent += `${T + T + T + T}else {${N}`;
            methodContent += `${T + T + T + T + T}_${middleTableRepositoryNameLower}.deleteAllBy${modelTableTree.modelName || ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id(model.id);${N}`;
            methodContent += `${T + T + T + T}}${N + N}`;
        });

        methodContent += `${T + T + T + T}return _baseResponse.setData(true);${N}`;
        methodContent += `${T + T + T}}${N}`;
        methodContent += `${T + T + T}catch (Exception e)${N}`;
        methodContent += `${T + T + T}{${N}`;
        methodContent += `${T + T + T + T}return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, e.Message);${N}`;
        methodContent += `${T + T + T}}${N}`;
        methodContent += `${T + T}}${N}`;

        return methodContent;
    }

    private _generateEditFullAllInterfaceTemplate(viewModelName: string): string {
        const T = "\t"; //Tab line
        return `${T + T} BaseResponse editFullAll(List<${viewModelName}VM> models);`;
    }

    private _generateEditFullAllTemplate(viewModelName: string): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var template = `${T + T}public BaseResponse editFullAll(List<${viewModelName}VM> models)${N}`;

        template += `${T + T}{${N +
            T + T + T}try${N +
            T + T + T}{${N +
            T + T + T + T}models.ForEach(model =>${N +
            T + T + T + T}{${N +
            T + T + T + T + T}editFull(model);${N +
            T + T + T + T}});${N +
            T + T + T + T}return _baseResponse.setData(true);${N +
            T + T + T}}${N +
            T + T + T}catch (Exception e)${N +
            T + T + T}{${N +
            T + T + T + T}return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, e.Message);${N +
            T + T + T}}${N +
            T + T}}`;

        return template;
    }

}