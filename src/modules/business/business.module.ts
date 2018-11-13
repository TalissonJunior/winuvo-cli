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

    create(name: string, modelName: string, callback: BaseCallback): void {
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
            callback(this.response.setError('Already exists business interface', `Already exists a business interface ${path.join(businessInterfacesPath, businessInterfaceExtension)}`));
        }
        else if (fs.existsSync(path.join(businessPath, businessNameWithExtension))) {
            callback(this.response.setError('Already exists business', `Already exists a business ${path.join(businessPath, businessNameWithExtension)}`));
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

                    if (models.length > 0 || modelsList.length > 0) {

                        // Creating the models that doesn´t exits
                        this.modelModule.createModelBasedOnTableNames(modelsToGenerate, (modelResponse) => {
                            var modelsGenerated = _.cloneDeep(modelResponse);

                            if (modelResponse.data) {

                                // Creating the ViewModel;
                                var viewModelName = ValidateService.transformStringToCamelCase(tableName + '_' + models.join('_') + '_' + modelsList.join('_'));

                                this.modelModule.createViewModel(viewModelName, tableName, models, modelsList, () => {

                                    var repositoryPromises = [];

                                    // Creating repositories
                                    modelsGenerated.data.forEach((model: ModelFile) => {

                                        var promise = new Promise((resolve, reject) => {
                                            this.repositoryModule.createRepository(model.modelName, model.modelName, (createRepositoryResponse) => {
                                                resolve(createRepositoryResponse.data);
                                            });
                                        });

                                        repositoryPromises.push(promise);
                                    });

                                    Promise.all(repositoryPromises).then(() => {
                                        var businessInsertFullTemplate = this._generateInsertFullTemplate(viewModelName, modelTableTree, modelsGenerated.data);
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
                                        var repositoryFileIterfacePath = path.join(process.cwd(), this.config['repositoryPath']['interfaces'], 'I' + ValidateService.capitalizeFirstLetter(fileName) + this.config['repositoryPath']['suffixExtension']);

                                        var businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        var businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');
                                        var repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');
                                        var repositoryFileInterfaceData = fs.readFileSync(repositoryFileIterfacePath, 'utf8');

                                        // Create middle table Methods
                                        this.repositoryModule.createMiddleTableMethodsTemplate(modelTableTree);

                                        // Get Full All Repository
                                        this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, repositoryGetFullAllTemplate));
                                        this.schematics.createFile(repositoryFileIterfacePath, this.schematics.addDataToClassBody(repositoryFileInterfaceData, repositoryGetFullAllInterfaceTemplate));

                                        // Get Full By ID Repository
                                        repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');
                                        repositoryFileInterfaceData = fs.readFileSync(repositoryFileIterfacePath, 'utf8');
                                        this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, repositoryGetFullByIdTemplate));
                                        this.schematics.createFile(repositoryFileIterfacePath, this.schematics.addDataToClassBody(repositoryFileInterfaceData, repositortGetFullByIdInterfaceTemplate));

                                        // Get Full All Helper Repository
                                        repositoryFileData = fs.readFileSync(repositoryFilePath, 'utf8');
                                        this.schematics.createFile(repositoryFilePath, this.schematics.addDataToClassBody(repositoryFileData, repositoryGetFullAllHelperTemplate));

                                        // Get Full All Business
                                        this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessGetFullAllTemplate));
                                        this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessGetFullAllInterfaceTemplate));

                                        // Get Full By ID Business 
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');
                                        this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessGetFullByIdTemplate));
                                        this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessGetFullByIdInterfaceTemplate));

                                        // Insert Full Business
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');
                                        this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessInsertFullTemplate));
                                        this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessInsertFullInterfaceTemplate));

                                        // Insert Full All Business
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');
                                        this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessInsertFullAllTemplate));
                                        this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessInsertFullAllInterfaceTemplate));

                                        // Edit Full Business
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');
                                        this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessEditFullTemplate));
                                        this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessEditFullInterfaceTemplate));

                                        // Edit Full All Business
                                        businessFileData = fs.readFileSync(businessFilePath, 'utf8');
                                        businessFileInterfaceData = fs.readFileSync(businessFileInterfacePath, 'utf8');
                                        this.schematics.createFile(businessFilePath, this.schematics.addDataToClassBody(businessFileData, businessEditFullAllTemplate));
                                        this.schematics.createFile(businessFileInterfacePath, this.schematics.addDataToClassBody(businessFileInterfaceData, businessEditFullAllInterfaceTemplate));

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

    private _generateInsertFullTemplate(viewModelName: string, modelTableTree: TableTree, availablesModelFiles: Array<ModelFile>): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var methodContent = `${T + T}public BaseResponse insertFull(${viewModelName}VM model) ${N + T + T}{${N}`;

        // Models object
        modelTableTree.references.forEach((table) => {
            var tableNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.name);
            var tableNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.name);

            methodContent += `${T + T + T}${tableNameUpper}Repository _${tableNameLower}Repository = new ${tableNameUpper}Repository(_configuration);${N}`;
        });

        // Models list
        modelTableTree.middleTables.forEach((middleTable) => {
            var middleTableModelFile = availablesModelFiles.find((modelFile) => modelFile.tableName == middleTable.referencedTable.name);
            var listModelFile = availablesModelFiles.find((modelFile) => modelFile.tableName == middleTable.referencedTable.references[0].referencedTable.name);

            methodContent += `${T + T + T}${middleTableModelFile.modelName}Repository _${ValidateService.lowercaseFirstLetter(middleTableModelFile.fileName)}Repository = new ${middleTableModelFile.modelName}Repository(_configuration);${N}`;
            methodContent += `${T + T + T}${listModelFile.modelName}Repository _${ValidateService.lowercaseFirstLetter(listModelFile.fileName)}Repository = new ${listModelFile.modelName}Repository(_configuration);${N}`;
            methodContent += `${T + T + T}IEnumerable<${listModelFile.modelName}> list${listModelFile.fileName} = _${ValidateService.lowercaseFirstLetter(listModelFile.fileName)}Repository.getAll();${N}`;
        });

        methodContent += `${N + T + T + T}try ${N + T + T + T}{${N}`;

        // Models object
        modelTableTree.references.forEach((table) => {
            var tableNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.name);

            var foreignKeyField = modelTableTree.columns.find(row => row.Field == table.foreignKeyReferenceTableColumnName);
            var castType = foreignKeyField.Type.indexOf('long') > -1 ? '' : '(int)';

            methodContent += `${T + T + T + T}model.${table.foreignKeyColumnName} = model.${tableNameLower}.${table.foreignKeyReferenceTableColumnName} > 0 ? model.${tableNameLower}.${table.foreignKeyReferenceTableColumnName} : ${castType}_${tableNameLower}Repository.insert(model.${tableNameLower});${N}`;
        });

        if (modelTableTree.references.length > 0) {
            methodContent += N;
        }

        if(modelTableTree.middleTables.length > 0){
            methodContent += `${T + T + T + T}long id = _repository.insert(model.ConvertTo<${ValidateService.transformStringToCamelCase(modelTableTree.name)}>());${N + N}`;
        }
        else{
            methodContent += `${T + T + T + T}_repository.insert(model.ConvertTo<${ValidateService.transformStringToCamelCase(modelTableTree.name)}>());${N + N}`;
        }

        // Models List
        modelTableTree.middleTables.forEach((middleTable) => {
            var middleTableModelFile = availablesModelFiles.find((modelFile) => modelFile.tableName == middleTable.referencedTable.name);
            var listModelFile = availablesModelFiles.find((modelFile) => modelFile.tableName == middleTable.referencedTable.references[0].referencedTable.name);

            var middleTableForeignKeyField = middleTable.referencedTable.columns.find(row => row.Field == middleTable.foreignKeyReferenceTableColumnName);
            var middleTableCastType = middleTableForeignKeyField.Type.indexOf('long') > -1 ? '' : '(int)';

            var middleTableChildForeignKeyField = middleTable.referencedTable.columns.find(row => row.Field == middleTable.referencedTable.references[0].foreignKeyColumnName);
            var middleTableChildCastType = middleTableChildForeignKeyField.Type.indexOf('long') > -1 ? '' : '(int)';

            methodContent += `${T + T + T + T}List<${middleTableModelFile.modelName}> list${middleTableModelFile.modelName} = new List<${middleTableModelFile.modelName}>();${N}`;

            methodContent += `${T + T + T + T}model.${pluralize.plural(ValidateService.lowercaseFirstLetter(listModelFile.modelName))}.ForEach((${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}) => ${N +
                T + T + T + T}{${N}`;

            methodContent += `${T + T + T + T + T}${middleTableModelFile.modelName} ${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)} = new ${middleTableModelFile.modelName}();${N}`;
            methodContent += `${T + T + T + T + T}${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)}.${middleTable.foreignKeyReferenceTableColumnName} = ${middleTableCastType}id;${N}`;

            methodContent += `${T + T + T + T + T}if(${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}.id > 0) ${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)}.${middleTable.referencedTable.references[0].foreignKeyColumnName} = ${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}.id;${N}`;
            methodContent += `${T + T + T + T + T}else${N + T + T + T + T + T}{${N}`;

            methodContent += `${T + T + T + T + T + T}${listModelFile.modelName} aux${listModelFile.modelName} = list${listModelFile.modelName}.ToList().Find(x => x.name == ${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}.name);${N}`;
            methodContent += `${T + T + T + T + T + T}${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)}.${middleTable.referencedTable.references[0].foreignKeyColumnName} = aux${listModelFile.modelName} != null ? aux${listModelFile.modelName}.id : ${middleTableChildCastType}_${ValidateService.lowercaseFirstLetter(listModelFile.fileName)}Repository.insert(${ValidateService.lowercaseFirstLetter(listModelFile.modelName)});${N}`;
            methodContent += `${T + T + T + T + T}}${N + N}`;

            methodContent += `${T + T + T + T + T}list${middleTableModelFile.modelName}.Add(${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)});${N}`;
            methodContent += `${T + T + T + T}});${N + N}`;

            methodContent += `${T + T + T + T}_${ValidateService.lowercaseFirstLetter(middleTableModelFile.fileName)}Repository.insert(list${middleTableModelFile.modelName});${N + N}`;
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
            var tableNameUpper = ValidateService.capitalizeFirstLetter(table.referencedTable.name);
            var tableNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.name);

            methodContent += `${T + T + T}${tableNameUpper}Repository _${tableNameLower}Repository = new ${tableNameUpper}Repository(_configuration);${N}`;
        });

        // Middle tables object
        modelTableTree.middleTables.forEach((table) => {
            var tableNameUpper = ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name));
            var tableNameLower = ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name));

            methodContent += `${T + T + T}${tableNameUpper}Repository _${tableNameLower}Repository = new ${tableNameUpper}Repository(_configuration);${N}`;
        });

        methodContent += `${N + T + T + T}try ${N + T + T + T}{${N}`;

        // Models object
        modelTableTree.references.forEach((table) => {
            var tableNameLower = ValidateService.lowercaseFirstLetter(table.referencedTable.name);

            methodContent += `${T + T + T + T}if (model.${tableNameLower}.id > 0){${N}`;
            methodContent += `${T + T + T + T + T} _${tableNameLower}Repository.update(model.${tableNameLower});${N}`;
            methodContent += `${T + T + T + T}}${N}`;
            methodContent += `${T + T + T + T}else {${N}`;
            methodContent += `${T + T + T + T + T} _${tableNameLower}Repository.insert(model.${tableNameLower});${N}`;
            methodContent += `${T + T + T + T}}${N + N}`;

            methodContent += `${T + T + T + T}model.${table.foreignKeyColumnName} = model.${tableNameLower}.${table.foreignKeyReferenceTableColumnName};${N}`;
        });

        methodContent += `${T + T + T + T}_repository.update(model.ConvertTo<${ValidateService.capitalizeFirstLetter(modelTableTree.name)}>());${N + N}`;

        // List tables object
        modelTableTree.middleTables.forEach((table) => {
            var middleTableNameUpper = ValidateService.capitalizeFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name));
            var middleTableNameLower = ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.name));
            var listModelNameLower = ValidateService.lowercaseFirstLetter(ValidateService.transformStringToCamelCase(table.referencedTable.references[0].referencedTable.name));

            methodContent += `${T + T + T + T}if (model.${pluralize.plural(listModelNameLower)}.Count > 0)${N}`;
            methodContent += `${T + T + T + T}{${N}`;
            methodContent += `${T + T + T + T + T}List<${middleTableNameUpper}> list${middleTableNameUpper} = _${middleTableNameLower}Repository.getAllBy${ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id(model.id);${N}`;
            methodContent += `${T + T + T + T + T}if(list${middleTableNameUpper}.Count > 0) {${N}`;
            methodContent += `${T + T + T + T + T + T}List<${middleTableNameUpper}> list${middleTableNameUpper}ToDelete = list${middleTableNameUpper}.Where((${middleTableNameLower}) => model.${pluralize.plural(listModelNameLower)}.Select((${listModelNameLower}) => ${listModelNameLower}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName} != ${middleTableNameLower}.${table.referencedTable.references[0].foreignKeyColumnName}) != null).ToList();${N}`;
            methodContent += `${T + T + T + T + T + T}_${middleTableNameLower}Repository.delete(list${middleTableNameUpper}ToDelete);${N}`;
            methodContent += `${T + T + T + T + T}}${N + N}`;

            methodContent += `${T + T + T + T + T}model.${pluralize.plural(listModelNameLower)}.ForEach((${listModelNameLower}) => {${N + N}`;
            methodContent += `${T + T + T + T + T + T}${middleTableNameUpper} ${middleTableNameLower} = new ${middleTableNameUpper}() {${N}`;
            methodContent += `${T + T + T + T + T + T + T}${table.referencedTable.references[0].foreignKeyColumnName} = ${table.referencedTable.references[0].referencedTable.name}.${table.referencedTable.references[0].foreignKeyReferenceTableColumnName},${N}`;
            methodContent += `${T + T + T + T + T + T + T}${table.foreignKeyReferenceTableColumnName} = model.${table.foreignKeyColumnName}${N}`;
            methodContent += `${T + T + T + T + T + T}};${N + N}`;

            methodContent += `${T + T + T + T + T + T}_${middleTableNameLower}Repository.insert(${middleTableNameLower});${N}`;
            methodContent += `${T + T + T + T + T}});${N + N}`;

            methodContent += `${T + T + T + T}}${N}`;
            methodContent += `${T + T + T + T}else {${N}`;
            methodContent += `${T + T + T + T + T}_${middleTableNameLower}Repository.deleteAllBy${ValidateService.capitalizeFirstLetter(modelTableTree.name)}Id(model.id);${N}`;
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