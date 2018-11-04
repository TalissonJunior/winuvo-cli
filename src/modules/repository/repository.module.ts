import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { BaseModule } from "../base.module";
import { Schematics } from '../../schematics/schematics';
import { ValidateService } from '../../services';
import { iRepositoryTemplate } from '../../schematics/templates/repository/interfaces';
import { repositoryTemplate } from '../../schematics/templates/repository/repositories';

export class RepositoryModule extends BaseModule {
    schematics: Schematics;

    constructor(spinner?: ora) {
        super(spinner);
        this.schematics = new Schematics();
    }

    create(modelName: string, callback: BaseCallback): void {
        modelName = modelName.replace(/Repository/g, '');

        var modelPath = path.join(process.cwd(), this.config['modelPath']['main']);
        var repositoryInterfacesPath = path.join(process.cwd(), this.config['repositoryPath']['interfaces']);
        var repositoryPath = path.join(process.cwd(), this.config['repositoryPath']['main']);

        var modelExtension = ValidateService.capitalizeFirstLetter(modelName)  + this.config['modelPath']['suffixExtension'];
        var repositoryInterfaceExtension = 'I' + ValidateService.capitalizeFirstLetter(modelName)  + this.config['repositoryPath']['suffixExtension'];
        var repositoryExtension = ValidateService.capitalizeFirstLetter(modelName)  + this.config['repositoryPath']['suffixExtension'];

        if(!fs.existsSync(path.join(modelPath, modelExtension))){
            callback(this.response.setError('Couldnt find model', `Coudn´t find a model with the name ${modelName} at ${path.join(modelPath, modelExtension)}`));
        }
        else if(fs.existsSync(path.join(repositoryInterfacesPath, repositoryInterfaceExtension))){
            callback(this.response.setError('Already exists repository interface', `Already exists a repository interface ${path.join(repositoryInterfacesPath, repositoryInterfaceExtension)}`));
        }
        else if(fs.existsSync(path.join(repositoryPath, repositoryExtension))){
            callback(this.response.setError('Already exists repository', `Already exists a repository ${path.join(repositoryPath, repositoryExtension)}`));
        }
        else{
            if (this.schematics.createFile(repositoryInterfacesPath, this._createRepositoryInterfaceFileTemplate(modelName), repositoryInterfaceExtension)) {

                if (this.schematics.createFile(repositoryPath, this._createRepositoryFileTemplate(modelName), repositoryExtension)) {
                    callback(this.response.setData(`<create/> ${path.join(repositoryInterfacesPath, repositoryInterfaceExtension)}\n<create/> ${path.join(repositoryPath, repositoryExtension)}`));
                }
                else{
                    callback(this.response.setError('Fail to create repository', ' Could not create the repository'));
                }
            }
            else{
                callback(this.response.setError('Fail to create repository interface', ' Could not create the repository interface'));
            }
        }
    }
 
    private _createRepositoryInterfaceFileTemplate(modelName: string): string {
        return iRepositoryTemplate(this.config['Project']['name'], modelName);
    }

    private _createRepositoryFileTemplate(modelName: string): string {
        return repositoryTemplate(this.config['Project']['name'], modelName);
    }
}