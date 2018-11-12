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
                file: 'Models/ViewModels/empty.cs',
                create: true,
                content: ''
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
                file: 'Models/ViewModels/empty.cs',
                delete: true
            },
            {
                file: 'Startup.cs',
                replaceAll: false,
                replaces: [
                    {
                        addAfterLine: 27,
                        addAfterKeyword: '',
                        addBeforeKeyword: '',
                        addToRight: '',
                        content: startupConfigureServicesTemplate()
                    },
                    {
                        addAfterLine: -1,
                        addAfterKeyword: 'app.UseDeveloperExceptionPage()',
                        addBeforeKeyword: '',
                        addToRight: '',
                        content: startupConfigureIsDevelopmentTemplate()
                    },
                    {
                        addAfterLine: -1,
                        addAfterKeyword: 'app.UseHsts()',
                        addBeforeKeyword: '',
                        addToRight: '',
                        content: startupConfigureIsProductionTemplate()
                    },
                    {
                        addAfterLine: -1,
                        addAfterKeyword: '',
                        addBeforeKeyword: 'app.UseHttpsRedirection()',
                        addToRight: '',
                        content: startupConfigureExceptionTemplate()
                    },
                    {
                        addAfterLine: 12,
                        addAfterKeyword: '',
                        addBeforeKeyword: '',
                        addToRight: '',
                        content: startupImportsTemplate(projectName)
                    }
                ]
            },
            {
                file: `${projectName}.csproj`,
                replaceAll: false,
                replaces: [
                    {
                        addAfterLine: -1,
                        addBeforeKeyword: '',
                        addToRight: 'PackageReference Include="Microsoft.AspNetCore.App"',
                        content: `Version="2.1.1"`
                    },
                    {
                        addAfterLine: -1,
                        addAfterKeyword: '<PackageReference',
                        addBeforeKeyword: '',
                        addToRight: '',
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

                    if (err) {
                        callback(this.response.setError(BaseResponseCode.FAIL_TO_CONFIG_BASE_SETTINGS, 'Failed to delete ' + file.file));
                    }
                    return;
                });
            }
            else {

                try {
                    var data = fs.readFileSync(destination, 'utf8');

                    file.replaces.forEach((replace) => {

                        if (replace.addToRight) {
                            data = this.addToRightOfTagKeyword(data, replace.content, replace.addToRight);
                        }
                        else if (replace.addAfterKeyword) {
                            data = this.addAfterKeyword(data, replace.content, replace.addAfterKeyword);
                        }
                        else if (replace.addBeforeKeyword) {
                            data = this.addBeforeKeyword(data, replace.content, replace.addBeforeKeyword);
                        }
                        else if (replace.addAfterLine) {
                            data = this.addAfterLine(data, replace.content, replace.addAfterLine);
                        }

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

    /**
     * @description Adds data after the keyword
     * @param data 
     * @param dataToAdd 
     * @param keyword must be unique
     */
    addAfterKeyword(data: string, dataToAdd: string, keyword: string): string {
        var array = data.split('\n');

        var replacementIndex = array.findIndex((line) => line.indexOf(keyword) > -1);

        if (replacementIndex) {
            array.splice(replacementIndex + 1, 0, dataToAdd);
        }

        return array.join('\n');
    }

    /**
    * @description Adds data after the keyword
    * @param data 
    * @param dataToAdd 
    * @param keyword must be unique
    */
    addBeforeKeyword(data: string, dataToAdd: string, keyword: string): string {
        var array = data.split('\n');

        var replacementIndex = array.findIndex((line) => line.indexOf(keyword) > -1);

        if (replacementIndex) {
            array.splice(replacementIndex, 0, dataToAdd);
        }

        return array.join('\n');
    }

    addToRightOfTagKeyword(data: string, dataToAdd: string, tagKeyword: string): string {
        var array = data.split('\n');

        var replacementIndex = array.findIndex((line) => line.indexOf(tagKeyword) > -1);

        if (replacementIndex) {
            dataToAdd = dataToAdd.replace(/\r?\n|\r/g, '');
            array[replacementIndex] = array[replacementIndex].replace('/>', ' ' + dataToAdd + ' />');
        }

        return array.join('\n');
    }

    addDataToClassBody(fileData: string, dataToAdd: string): string {
        var array = fileData.split('\n');

        var count = 0;
        var lineIndex;
        for (let index = array.length - 1; index > 0; index--) {
            
            if(array[index].indexOf('}') > -1) {
                count += 1;
                lineIndex = index;
            }

            if(count == 2) {
                break;
            }
        }

        if(lineIndex){
            array.splice(lineIndex, 0, dataToAdd);
        }

        return array.join('\n');
    }

    /**
     * 
     * @param data file data
     * @param matchBefore string to matches before the strin you are looking for 
     * @param matchAfter string that matches after the string you are looking for
     * @example you want to find "competence" that has [table("competence")],
     * '[table("' <- woul be the "matchBefore" and '")]" would be the "matchAfter"
     */
    getStringBetween(data: string, matchBefore: string, matchAfter: string): string {
        var array = data.split('\n');
        var searchString = null;
        var line = array.find((line) => line.indexOf(matchBefore) > -1 && line.indexOf(matchAfter) > -1);

        if (line) {
            var matchBeforePosition = line.indexOf(matchBefore);

            searchString = line.substring(matchBeforePosition + matchBefore.length);

            var matchAfterPosition = searchString.indexOf(matchAfter);
            searchString = searchString.substring(0, matchAfterPosition);
        }

        return searchString;
    }

    getStringAfter(data: string, matchBefore: string): string {
        var array = data.split('\n');
        var searchString = null;
        var line = array.find((line) => line.indexOf(matchBefore) > -1);

        if (line) {
            var matchBeforePosition = line.indexOf(matchBefore);

            searchString = line.substring(matchBeforePosition + matchBefore.length);
        }

        return searchString;
    }



}