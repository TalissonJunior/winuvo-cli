import { ProjectType } from "../../enums/project-type.enum";
import { exec } from "child_process";
import { ProjectDependency } from "../../models/interfaces";
import { BaseResponse } from "../../utilities";
import { BaseResponseCode } from "../../enums";

export class ProjectValidator {

    constructor() { }

    /**
     * @description Check if value contains letters,numbers,dash, dot 
     * @param name 
     * @returns the invalid characteres
     */
    public static validateName(name: string): string {
        if (name) {
            return name.replace(new RegExp("[a-zA-Z0-9-/]", "g"), "");
        }

        return null;
    }

    public static hasValidOptionType(option: string): boolean {
        for (let property in ProjectType) {

            if (option == ProjectType[property]) {
                return true;
            }
        }

        return false;
    }

    public static checkDependencies(callback: BaseCallback): void {
        var response = new BaseResponse();
        var dependencies = this._getDependencies();
        var hasInvalidDependency = false;

        if (dependencies.length > 0) {

            dependencies.forEach(async (dependency) => {

                if (!hasInvalidDependency) {
                    await exec(dependency.command, (error: Error) => {
                        if (error) {
                            callback(response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT_DEPENDENCY_NOT_INSTALLED, dependency.errorMessage));
                            hasInvalidDependency = true;
                        }
                        else {
                            callback(response.setData(true));
                        }
                    });
                }
            });
        }
        else {
            callback(response.setData(true));
        }
    }

    private static _getDependencies(): Array<ProjectDependency> {
        return [
            {
                name: 'dotnet',
                errorMessage: 'It seems that you don´t have dotnet core installed visit["https://github.com/dotnet/core"] to install it.',
                command: 'dotnet --info'
            },

        ] as Array<ProjectDependency>;
    }
}