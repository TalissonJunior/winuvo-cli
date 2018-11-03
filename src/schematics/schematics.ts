import * as path from 'path';
import * as fs from 'fs';
import { ConnectionString } from "../models/connnection-string";
import { ProjectOptions } from "../models";
import { BaseResponse } from '../utilities';
import { BaseResponseCode } from '../enums';
import { appsettingsTemplate, projectcsprojTemplate, startupConfigureServicesTemplate, startupConfigureIsDevelopmentTemplate, startupConfigureIsProductionTemplate, startupConfigureExceptionTemplate } from './templates';

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
                fileName: 'appsettings.json',
                replaceAll: true,
                content: appsettingsTemplate(projectName, connectionString)
            },
            {
                fileName: 'Startup.cs',
                replaceAll: false,
                addAfterLine: 27,
                content: startupConfigureServicesTemplate()
            },
            {
                fileName: 'Startup.cs',
                replaceAll: false,
                addAfterLine: 89,
                content: startupConfigureIsDevelopmentTemplate()
            },
            {
                fileName: 'Startup.cs',
                replaceAll: false,
                addAfterLine: 98,
                content: startupConfigureIsProductionTemplate()
            },
            {
                fileName: 'Startup.cs',
                replaceAll: false,
                addAfterLine: 105,
                content: startupConfigureExceptionTemplate()
            },
            {
                fileName: `${projectName}.csproj`,
                replaceAll: false,
                addAfterLine: 13,
                content: projectcsprojTemplate()
            }
        ];

        files.forEach(async (file, position) => {
            var destination = path.resolve(process.cwd(), projectOptions.localPath, file.fileName);

            if (file.replaceAll) {
                try {
                    fs.writeFileSync(destination, file.content, 'utf8');
                }
                catch (e) {
                    callback(this.response.setError(BaseResponseCode.FAIL_TO_CONFIG_BASE_SETTINGS, 'Failed to update ' + file.fileName));
                    return;
                }
            }
            else {

                try {
                    var data = fs.readFileSync(destination, 'utf8');

                    data = this._addAfterLine(data, file.content, file.addAfterLine);
                    fs.writeFileSync(destination, data);
                }
                catch {
                    callback(this.response.setError(BaseResponseCode.FAIL_TO_CONFIG_BASE_SETTINGS, 'Failed to update ' + file.fileName));
                    return;
                }
            }

            if (files.length - 1 == position) {
                callback(this.response.setData(true));
                return;
            }
        });
    }

    private _addAfterLine(data: string, dataToAdd: string, line: number): string {
        var array = data.split('\n');

        array.splice(line, 0, dataToAdd);

        return array.join('\n');
    }

}