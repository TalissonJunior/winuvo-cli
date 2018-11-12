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


                        this._generateInsertFullMethod(businessNameWithExtension, modelName, () => {
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

    private _generateInsertFullMethod(fileNameWithExtension: string, modelName: string, callback: BaseCallback) {

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
                                var viewModelName = ValidateService.transformStringToCamelCase(tableName + models.join('_') + '_' + modelsList.join('_'));

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
                                        var insertFullTemplate = this._generateInsertFullTemplate(viewModelName, modelTableTree, modelsGenerated.data);
                                        var insertFullInterfaceTemplate = this._generateInsertFullInterfaceTemplate(viewModelName);
                                       
                                        var filePath = path.join(process.cwd(), this.config['businessPath']['main'], fileNameWithExtension);
                                        var fileInterfacePath = path.join(process.cwd(), this.config['businessPath']['interfaces'], 'I' + fileNameWithExtension);

                                        var fileData = fs.readFileSync(filePath, 'utf8');
                                        var fileInterfaceData = fs.readFileSync(fileInterfacePath, 'utf8');
                                        
                                        this.schematics.createFile(filePath, this.schematics.addDataToClassBody(fileData, insertFullTemplate));
                                        this.schematics.createFile(fileInterfacePath, this.schematics.addDataToClassBody(fileInterfaceData, insertFullInterfaceTemplate));

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

    private _generateInsertFullInterfaceTemplate(viewModelName: string,): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        return `${T + T} BaseResponse insertFull(${viewModelName}VM model);`;
    }

    private _generateInsertFullTemplate(viewModelName: string, modelTableTree: TableTree, availablesModelFiles: Array<ModelFile>): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var methodContent = `${T + T}public BaseResponse insertFull(${viewModelName}VM model) ${N + T + T}{${N}`;

        modelTableTree.middleTables.forEach((middleTable) => {
            var middleTableModelFile = availablesModelFiles.find((modelFile) => modelFile.tableName == middleTable.referencedTable.name);
            var listModelFile = availablesModelFiles.find((modelFile) => modelFile.tableName == middleTable.referencedTable.references[0].referencedTable.name);

            methodContent += `${T + T + T}${middleTableModelFile.modelName}Repository _${ValidateService.lowercaseFirstLetter(middleTableModelFile.fileName)}Repository = new ${middleTableModelFile.modelName}Repository(_configuration);${N}`;
            methodContent += `${T + T + T}${listModelFile.modelName}Repository _${ValidateService.lowercaseFirstLetter(listModelFile.fileName)}Repository = new ${listModelFile.modelName}Repository(_configuration);${N}`;
            methodContent += `${T + T + T}IEnumerable<${listModelFile.modelName}> list${listModelFile.fileName} = _${ValidateService.lowercaseFirstLetter(listModelFile.fileName)}Repository.getAll();${N}`;
        });

        methodContent += `${N + T + T + T}try ${N + T + T + T}{${N}`;
        methodContent += `${T + T + T + T}long id = _repository.insert(model.ConvertTo<${ValidateService.transformStringToCamelCase(modelTableTree.name)}>()).id;${N + N}`;

        modelTableTree.middleTables.forEach((middleTable) => {
            var middleTableModelFile = availablesModelFiles.find((modelFile) => modelFile.tableName == middleTable.referencedTable.name);
            var listModelFile = availablesModelFiles.find((modelFile) => modelFile.tableName == middleTable.referencedTable.references[0].referencedTable.name);

            methodContent += `${T + T + T + T}List<${middleTableModelFile.modelName}> list${middleTableModelFile.modelName} = new List<${middleTableModelFile.modelName}>();${N}`;

            methodContent += `${T + T + T + T}model.${pluralize.plural(ValidateService.lowercaseFirstLetter(listModelFile.modelName))}.ForEach((${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}) => ${N +
                T + T + T + T}{${N}`;

            methodContent += `${T + T + T + T + T}${middleTableModelFile.modelName} ${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)} = new ${middleTableModelFile.modelName}();${N}`;
            methodContent += `${T + T + T + T + T}${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)}.${middleTable.foreignKeyReferenceTableColumnName} = id;${N}`;

            methodContent += `${T + T + T + T + T}if(${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}.id > 0) ${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)}.${middleTable.referencedTable.references[0].foreignKeyColumnName} = ${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}.id;${N}`;
            methodContent += `${T + T + T + T + T}else${N + T + T + T + T + T}{${N}`;

            methodContent += `${T + T + T + T + T + T}${listModelFile.modelName} aux${listModelFile.modelName} = list${listModelFile.modelName}.ToList().Find(x => x.name == ${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}.name);${N}`;
            methodContent += `${T + T + T + T + T + T}${ValidateService.lowercaseFirstLetter(middleTableModelFile.modelName)}.${middleTable.referencedTable.references[0].foreignKeyColumnName} = aux${listModelFile.modelName} != null ? aux${listModelFile.modelName}.id : _${ValidateService.lowercaseFirstLetter(listModelFile.fileName)}Repository.insert(${ValidateService.lowercaseFirstLetter(listModelFile.modelName)}).id;${N}`;
            methodContent += `${T + T + T + T + T }}${N + N}`;

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

}