import * as path from 'path';
import * as fs from 'fs';
import { ConnectionString } from "../models/connection-string";
import { ProjectOptions } from "../models";
import { BaseResponse } from '../utilities';
import { BaseResponseCode } from '../enums';
import {
    appSettingsTemplate, projectCsprojTemplate,
    startupConfigureServicesTemplate, startupConfigureIsDevelopmentTemplate,
    startupConfigureIsProductionTemplate, startupConfigureExceptionTemplate, winuvoTemplate, startupImportsTemplate
} from './templates/project';
import { modelHandlerTemplate, dateAttributesTemplate } from './templates/model';
import { baseRepositoryTemplate } from './templates/repository/repositories';
import { iBaseRepositoryTemplate } from './templates/repository/interfaces';
import { responseTemplate, utilsTemplate, hashTemplate } from './templates/business/utilities';
import { baseBusinessTemplate } from './templates/business/rules';
import { iBaseBusinessTemplate } from './templates/business/interfaces';
import { enumBaseResponseCodeTemplate } from './templates/project/enumBaseReponseCode.template';
import { enumBaseResponseMessageTemplate } from './templates/project/enumBaseReponseMessage';

export class Schematics {
    protected response: BaseResponse;

    constructor() {
        this.response = new BaseResponse();
    }

    projectInitialSettings(projectOptions: ProjectOptions, connectionString: ConnectionString, callback: BaseCallback) {

        var projectName: any = projectOptions.name.split('/') || projectOptions.name.split('\\');
        projectName = projectName.length > 1 ? projectName[projectName.length - 1] : projectOptions.name;

        var files = [
            {
                file: 'appsettings.json',
                replaceAll: true,
                content: appSettingsTemplate(projectName, connectionString)
            },
            {
                file: 'winuvo.json',
                create: true,
                content: winuvoTemplate(projectName)
            },
            {
                file: 'Models/Database/ModelHandler.cs',
                create: true,
                content: modelHandlerTemplate(projectName)
            },
            {
                file: 'Models/Attributes/Attributes.cs',
                create: true,
                content: dateAttributesTemplate(projectName)
            },
            {
                file: 'Repository/Interfaces/IBaseRepository.cs',
                create: true,
                content: iBaseRepositoryTemplate(projectName)
            },
            {
                file: 'Repository/Repositories/BaseRepository.cs',
                create: true,
                content: baseRepositoryTemplate(projectName)
            },
            {
                file: 'Business/Enums/BaseResponseCode.cs',
                create: true,
                content: enumBaseResponseCodeTemplate(projectName)
            },
            {
                file: 'Business/Enums/BaseResponseMessage.cs',
                create: true,
                content: enumBaseResponseMessageTemplate(projectName)
            },
            {
                file: 'Business/Utilities/Response.cs',
                create: true,
                content: responseTemplate(projectName)
            },
            {
                file: 'Business/Utilities/Utils.cs',
                create: true,
                content: utilsTemplate(projectName)
            },
            {
                file: 'Business/Utilities/Hash.cs',
                create: true,
                content: hashTemplate(projectName)
            },
            {
                file: 'Business/Interfaces/IBaseBusiness.cs',
                create: true,
                content: iBaseBusinessTemplate(projectName)
            },
            {
                file: 'Business/Rules/BaseBusiness.cs',
                create: true,
                content: baseBusinessTemplate(projectName)
            },
            {
                file: 'Controllers/ValuesController.cs',
                delete: true
            },
            {
                file: 'Startup.cs',
                replaceAll: false,
                replaces: [
                    {
                        addAfterLine: 27,
                        content: startupConfigureServicesTemplate()
                    },
                    {
                        addAfterLine: 89,
                        content: startupConfigureIsDevelopmentTemplate()
                    },
                    {
                        addAfterLine: 98,
                        content: startupConfigureIsProductionTemplate()
                    },
                    {
                        addAfterLine: 105,
                        content: startupConfigureExceptionTemplate()
                    },
                    {
                        addAfterLine: 12,
                        content: startupImportsTemplate(projectName)
                    }
                ]
            },
            {
                file: `${projectName}.csproj`,
                replaceAll: false,
                replaces: [
                    {
                        addAfterLine: 13,
                        content: projectCsprojTemplate()
                    }
                ]

            }
        ];

        files.forEach(async (file, position) => {
            var destination = path.join(projectOptions.localPath, file.file);

            if (file.replaceAll) {
                try {
                    fs.writeFileSync(destination, file.content, 'utf8');
                }
                catch (e) {
                    callback(this.response.setError(BaseResponseCode.FAIL_TO_CONFIG_BASE_SETTINGS, 'Failed to update ' + file.file));
                    return;
                }
            }
            else if (file.create) {
                if (!this.createFile(destination, file.content)) {
                    callback(this.response.setError(BaseResponseCode.FAIL_TO_CONFIG_BASE_SETTINGS, 'Failed to create ' + file.file));
                }
            }
            else if (file.delete) {
                
                fs.unlink(destination, (err: NodeJS.ErrnoException) => {

                    if(err){
                        callback(this.response.setError(BaseResponseCode.FAIL_TO_CONFIG_BASE_SETTINGS, 'Failed to delete ' + file.file));
                    }
                    else{
                        callback(this.response.setData(true));
                    }
                    
                    return;
                });
            }
            else {

                try {
                    var data = fs.readFileSync(destination, 'utf8');

                    file.replaces.forEach((replace) => {
                        data = this.addAfterLine(data, replace.content, replace.addAfterLine);
                    });

                    fs.writeFileSync(destination, data);
                }
                catch {
                    callback(this.response.setError(BaseResponseCode.FAIL_TO_CONFIG_BASE_SETTINGS, 'Failed to update ' + file.file));
                    return;
                }
            }

            if (files.length - 1 == position) {
                callback(this.response.setData(true));
                return;
            }
        });
    }

    createFile(filePath: string, template: string, nameWithExtension: string = null): boolean {
        try {
            var hasExtension = path.parse(filePath).ext;
            var directoriesPath = filePath;

            // If has extension
            if (hasExtension) {
                // remove file name with extension
                directoriesPath = directoriesPath.substr(0, directoriesPath.indexOf(path.basename(filePath)));
            }

            var directories = directoriesPath.split('\\').length > directoriesPath.split('/').length ? directoriesPath.split('\\') : directoriesPath.split('/');

            directories.reduce((path, subPath) => {
                let currentPath;
                if (subPath != '.') {
                    currentPath = path + '/' + subPath;

                    if (!fs.existsSync(currentPath)) {
                        fs.mkdirSync(currentPath);
                    }
                }
                else {
                    currentPath = subPath;
                }
                return currentPath;
            });


            if (hasExtension && nameWithExtension || !hasExtension && nameWithExtension) {
                filePath = path.join(directoriesPath, nameWithExtension);
            }
            else {
                filePath = path.join(directoriesPath, path.basename(filePath));
            }

            fs.writeFileSync(filePath, template, 'utf8');

            return true;
        }
        catch {
            return false;
        }
    }

    addAfterLine(data: string, dataToAdd: string, line: number): string {
        var array = data.split('\n');

        array.splice(line, 0, dataToAdd);

        return array.join('\n');
    }

}