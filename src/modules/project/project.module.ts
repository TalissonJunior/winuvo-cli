import * as path from 'path';
import * as fs from 'fs';
import { BaseResponseCode } from '../../enums';
import { ProjectOptions, ProjectValidator } from "..";
import { BaseModule } from '../base.module';
import { exec, ExecException } from 'child_process';

export class Project extends BaseModule {

    constructor() {
        super();
    }

    create(options: ProjectOptions, callback: BaseCallback): void {
        var destination = path.resolve(process.cwd(), options.name);

        if (!fs.existsSync(destination)) {
            options.localPath = destination;

            this.spinner.isSpinning ? this.spinner.text = 'Checking dependencies...' : this.spinner.start('Checking dependencies...');

            ProjectValidator.checkDependencies((dependencyResponse) => {

                if (dependencyResponse.data) {
                    this.spinner.succeed();
                    this._createDotnetCoreProject(options, callback);
                }
                else {
                    this.spinner.fail();
                    callback(dependencyResponse);
                }

            });

        }
        else {
            callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT, `Already exists a folder "@!${options.name}!@".`));
        }
    }

    private _createDotnetCoreProject(options: ProjectOptions, callback: BaseCallback) {
        exec(`dotnet new webapi -o ${options.localPath}`, (error: ExecException) => {

            if (error) {
                callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT, error.message));
            }
            else {
                callback(this.response.setData(true));
            }
        });
    }
}