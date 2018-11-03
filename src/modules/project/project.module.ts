import * as path from 'path';
import * as fs from 'fs';
import { BaseResponseCode } from '../../enums';
import { ProjectValidator } from "..";
import { BaseModule } from '../base.module';
import { exec, ExecException } from 'child_process';
import { ProjectOptions } from '../../models';
import * as ora from 'ora';
import { DatabaseModule } from '../database/database.module';
import { Schematics } from '../../schematics/schematics';

export class Project extends BaseModule {
    database: DatabaseModule;
    schematics: Schematics;

    constructor(spinner?: ora) {
        super(spinner);
        this.database = new DatabaseModule();
        this.schematics = new Schematics();
    }

    create(options: ProjectOptions, callback: BaseCallback): void {
        var destination = path.resolve(process.cwd(), options.name);

        if (!fs.existsSync(destination)) {
            options.localPath = destination;

            this.spinner.isSpinning ? this.spinner.text = 'Validating dependencies...' : this.spinner.start('Validating dependencies...');

            ProjectValidator.checkDependencies((dependencyResponse) => {

                if (dependencyResponse.data) {
                    this.spinner.succeed();

                    if (options.connectionString) {
                        this.spinner.start('Validating connectionString...');

                        this.database.validateConnectionString(options.connectionString, (response) => {

                            if (response.data) {
                                this.spinner.succeed();
                                this.spinner.start('Creating project...');
                                this._createDotnetCoreProject(options, callback);
                            }
                            else {
                                this.spinner.fail();
                                callback(response);
                            }
                        });
                    }
                    else {
                        this._createDotnetCoreProject(options, callback);
                    }
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
                this.spinner.start('Configuring base settings...');
                this._addBaseSettings(options, callback);
            }
        });
    }

    private _addBaseSettings(options: ProjectOptions, callback: BaseCallback) {
        this.schematics.projectInitialSettings(options, this.database.connectionString, callback);
    }
}