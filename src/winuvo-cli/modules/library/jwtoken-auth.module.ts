import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { BaseModule } from "../base.module";
import { Table, TableColumn } from '../../models/interfaces';
import { TableTree } from '../../models/interfaces/table-tree';
import { validCreatedDateFields, validUpdatedDateFields } from '../model/constants/valid-create-update-date-fields';
import { ModelModule } from '../model/model.module';
import { ValidateService } from '../../services';
import { ModelOptions } from '../../models';
import { jwtAuthRepositoryTemplate } from '../../schematics/templates/repository/repositories';
import { jwtAuthControllerTemplate } from '../../schematics/templates/project';
import { jwtAuthBusinessTemplate } from '../../schematics/templates/business/rules';
import { ijwtAuthBusinessTemplate } from '../../schematics/templates/business/interfaces';
import { ijwtAuthRepositoryTemplate } from '../../schematics/templates/repository/interfaces';
import { BusinessModule } from '../business/business.module';
import { emailTemplate, sendEmailOptionsTemplate } from '../../schematics/templates/business/utilities';
import { yesNoTemplate, emailTemplateHtmlTemplate } from '../../schematics/templates/business/enums';

export class JWTokenModule extends BaseModule {
    propertiesToCheck = {
        'id': true,
        'login': true,
        'name': true,
        'email': true,
        'email_verified': true,
        'password': true,
        'password_salt': true,
        'refresh_token': true,
        'role': true
    };

    propertiesToCheckType = {
        'id': 'INT(11)',
        'login': 'VARCHAR(50)',
        'name': 'VARCHAR(150)',
        'email': 'VARCHAR(100)',
        'email_verified': "ENUM('yes','no')",
        'password': 'VARCHAR(128)',
        'password_salt': 'VARCHAR(150)',
        'refresh_token': 'VARCHAR(150)',
        'role': "ENUM('administrator')"
    };

    propertiesToCheckNull = {
        'id': 'no',
        'login': 'no',
        'name': 'yes',
        'email': 'yes',
        'email_verified': "yes",
        'password': 'no',
        'password_salt': 'no',
        'refresh_token': 'yes',
        'role': "no"
    };
    modelModule: ModelModule;
    businessModule: BusinessModule;

    constructor(spinner?: ora) {
        super(spinner);
        this.modelModule = new ModelModule(spinner);
        this.businessModule = new BusinessModule(spinner);
    }

    add(tableName: string, callback: BaseCallback, permissionToUpdateTableProperties = false) {
        var table: TableTree;

        if (tableName) {

            this.database.getTable(tableName, (response) => {

                if (response.data) {
                    table = response.data;

                    var validProperty = this.validateTableProperties(table);

                    // invalid properties
                    if (validProperty != 'true' && !permissionToUpdateTableProperties) {
                        callback(this.response.setError('missing-table-properties', validProperty));
                    }
                    else if (validProperty != 'true' && permissionToUpdateTableProperties) {

                        var missingPropeties = this.createMissingPropertiesArray(validProperty.split(','));

                        this.spinner.start('Updating table properties...');
                        this.database.updateTableProperties(tableName, missingPropeties, () => {
                            this.spinner.succeed();

                            this.spinner.start('Add JWTAuth library...');

                            this.database.getTable(tableName, (tableResponse) => {

                                if (tableResponse.data) {
                                    this.addJWTAuth(tableResponse.data, callback);
                                }
                                else {
                                    callback(tableResponse);
                                }
                            });

                        });
                    }
                    // Valid properties
                    else {
                        this.addJWTAuth(table, callback);
                    }
                }
                else {
                    callback(response);
                }
            });
        }
        else {
            this.database.connect(null, () => {
                this.createTable((response) => {
                    var tableName;
                    if (response.data) {
                        tableName = response.data;

                        this.spinner.start(`Created table ${tableName}`);
                        this.spinner.succeed();

                        this.database.getTable(tableName, (tableResponse) => {

                            if (tableResponse.data) {
                                this.addJWTAuth(tableResponse.data, callback);
                            }
                            else {
                                callback(tableResponse);
                            }
                        });
                    }
                    else {
                        callback(response);
                    }
                });
            });
        }

    }

    addJWTAuth(table: TableTree, callback: BaseCallback) {
        var messageToReturn = '';
        var modelOptions = {
            name: ValidateService.transformStringToCamelCase(table.name),
            table: table.name
        } as ModelOptions;

        var authFileName = 'JWTokenAuth';
        var projectName = this.config['Project']['name'];

        this.modelModule.create(modelOptions, (modelResponse) => {
 
            if (modelResponse.data) {
                var repositoriesPath = path.join(process.cwd(), this.config['repositoryPath']['main']);
                var repositoryInterfacesPath = path.join(process.cwd(), this.config['repositoryPath']['interfaces']);
                var businessPath = path.join(process.cwd(), this.config['businessPath']['main']);
                var businessInterfacesPath = path.join(process.cwd(), this.config['businessPath']['interfaces']);
                var controllerPath = path.join(process.cwd(), this.config['controllerPath']['main']);

                var repositoryNameWithExtension =  authFileName + this.config['repositoryPath']['suffixExtension'];
                var repositoryInterfaceNameWithExtension = 'I' + authFileName + this.config['repositoryPath']['suffixExtension'];
                var businessNameWithExtension =  authFileName + this.config['businessPath']['suffixExtension'];
                var businessInterfaceNameWithExtension = 'I' + authFileName + this.config['businessPath']['suffixExtension'];
                var controllerNameWithExtension =  authFileName + this.config['controllerPath']['suffixExtension'];

                var repositoryAuthPath = path.join(repositoriesPath, repositoryNameWithExtension);
                var repositoryInterfaceAuthPath = path.join(repositoryInterfacesPath, repositoryInterfaceNameWithExtension);
                var businessAuthPath = path.join(businessPath, businessNameWithExtension);
                var businessInterfaceAuthPath = path.join(businessInterfacesPath, businessInterfaceNameWithExtension);
                var controllerAuthPath = path.join(controllerPath, controllerNameWithExtension);
                
                var emailDependencyPath = path.join(businessPath, '../Utilities/Email.cs');
                var emailOptionsDependencyPath = path.join(businessPath, '../Utilities/SendEmailOptions.cs');
                var yesOrNoEnumDependencyPath = path.join(businessPath, '../Enums/YesOrNo.cs');
                var emailTemplateHtmlEnumDependencyPath = path.join(businessPath, '../Enums/EmailTemplateHtml.cs');
                
                // Dependencies
                if(!fs.existsSync(emailDependencyPath)){
                    this.schematics.createFile(emailDependencyPath, emailTemplate(projectName));
                    messageToReturn += '\n<create/> ' + emailDependencyPath;
                }

                if(!fs.existsSync(emailOptionsDependencyPath)){
                    this.schematics.createFile(emailOptionsDependencyPath, sendEmailOptionsTemplate(projectName));
                    messageToReturn += '\n<create/> ' + emailOptionsDependencyPath;
                }

                if(!fs.existsSync(yesOrNoEnumDependencyPath)){
                    this.schematics.createFile(yesOrNoEnumDependencyPath, yesNoTemplate(projectName));
                    messageToReturn += '\n<create/> ' + yesOrNoEnumDependencyPath;
                }

                if(!fs.existsSync(emailTemplateHtmlEnumDependencyPath)){
                    this.schematics.createFile(emailTemplateHtmlEnumDependencyPath, emailTemplateHtmlTemplate(projectName));
                    messageToReturn += '\n<create/> ' + emailTemplateHtmlEnumDependencyPath;
                }

                // Auth files
                if (!fs.existsSync(repositoryInterfaceAuthPath)) {
                    this.schematics.createFile(repositoryInterfaceAuthPath, ijwtAuthRepositoryTemplate(projectName, modelOptions.name));
                    messageToReturn += '\n<create/> ' + repositoryInterfaceAuthPath;
                }

                if (!fs.existsSync(repositoryAuthPath)) {
                    this.schematics.createFile(repositoryAuthPath, jwtAuthRepositoryTemplate(projectName, modelOptions.name));
                    messageToReturn += '\n<create/> ' + repositoryAuthPath;
                    this.businessModule.addStartupService(repositoryInterfaceNameWithExtension, repositoryNameWithExtension);
                    messageToReturn += '\n<update/> ' + path.join(process.cwd(), 'Startup.cs');
                }

                if (!fs.existsSync(businessInterfaceAuthPath)) {
                    this.schematics.createFile(businessInterfaceAuthPath, ijwtAuthBusinessTemplate(projectName, modelOptions.name));
                    messageToReturn += '\n<create/> ' + businessInterfaceAuthPath;
                }
            
                if (!fs.existsSync(businessAuthPath)) {
                    this.schematics.createFile(businessAuthPath, jwtAuthBusinessTemplate(projectName, modelOptions.name));
                    messageToReturn += '\n<create/> ' + businessAuthPath;
                  
                    this.businessModule.addStartupService(businessInterfaceNameWithExtension, businessNameWithExtension);
                    messageToReturn += '\n<update/> ' + path.join(process.cwd(), 'Startup.cs');
                }

                if (!fs.existsSync(controllerAuthPath)) {
                    this.schematics.createFile(controllerAuthPath, jwtAuthControllerTemplate(projectName, modelOptions.name));
                    messageToReturn += '\n<create/> ' + controllerAuthPath;
                }

                callback(this.response.setData(messageToReturn));
            }
            else {
                callback(modelResponse);
            }
        }, false);
    }

    private validateTableProperties(table: Table): string {
        var missingPropeties = [];
        var isMissingCreateDateProperty = true;
        var isMissingUpdateDateProperty = true;

        for (let property in this.propertiesToCheck) {
            missingPropeties.push(property);
        }

        missingPropeties = missingPropeties.filter((property) => table.columns.find((column) => column.Field == property) == null);

        for (let index = 0; index < table.columns.length; index++) {

            if (validCreatedDateFields[table.columns[index].Field]) {
                isMissingCreateDateProperty = false;
            }

            if (validUpdatedDateFields[table.columns[index].Field]) {
                isMissingUpdateDateProperty = false;
            }
        }

        if (isMissingCreateDateProperty) {
            missingPropeties.push('create_date');
        }

        if (isMissingUpdateDateProperty) {
            missingPropeties.push('update_date');
        }

        return missingPropeties.length > 0 ? missingPropeties.join(',') : 'true';
    }

    private createMissingPropertiesArray(missingPropeties: Array<string>): Array<TableColumn> {

        var tableColumnProperties = [];

        missingPropeties.forEach((property) => {

            if (validCreatedDateFields[property]) {
                tableColumnProperties.push({
                    Field: property,
                    Null: 'no',
                    Type: 'DATETIME',
                    Default: "DEFAULT '0001-01-01 00:00:00'"
                } as TableColumn);
            }

            if (validUpdatedDateFields[property]) {
                tableColumnProperties.push({
                    Field: property,
                    Null: 'no',
                    Type: 'DATETIME',
                    Default: "DEFAULT '0001-01-01 00:00:00'"
                } as TableColumn);
            }

            if (!validCreatedDateFields[property] && !validUpdatedDateFields[property]) {
                tableColumnProperties.push({
                    Field: property,
                    Null: this.propertiesToCheckNull[property],
                    Type: this.propertiesToCheckType[property]
                } as TableColumn);
            }
        });

        return tableColumnProperties;
    }

    private createTable(callback: BaseCallback) {
        var sql = '';
        var tableName;
        if (this.database.checkIfTableExists('user')) {
            tableName = 'user_auth';
        }
        else {
            tableName = 'user';
        }

        sql += "CREATE TABLE `" + tableName + "` (" +
            "`id` int(11) NOT NULL AUTO_INCREMENT," +
            "`login` varchar(50) NOT NULL," +
            "`name` varchar(150)," +
            "`email` varchar(100)," +
            "`email_verified`  enum('yes','no')," +
            "`password` varchar(128) NOT NULL," +
            "`password_salt` varchar(150) NOT NULL," +
            "`refresh_token` varchar(150)," +
            "`role` enum('administrator') NOT NULL," +
            "`create_date` datetime NOT NULL DEFAULT '0001-01-01 00:00:00'," +
            "`update_date` datetime NOT NULL DEFAULT '0001-01-01 00:00:00'," +
            "PRIMARY KEY (`id`)," +
            "UNIQUE KEY `id_UNIQUE` (`id`)" +
            ") ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;";

        this.database.executeQuery(tableName, sql, (databaseCallback) => {
            if (databaseCallback) {
                callback(this.response.setData(tableName));
            }
            else {
                callback(databaseCallback);
            }
        });
    }
}