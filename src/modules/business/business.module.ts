import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { BaseModule } from "../base.module";
import { Schematics } from '../../schematics/schematics';
import { ValidateService } from '../../services';
import { businessTemplate } from '../../schematics/templates/business/rules';
import { iBusinessTemplate } from '../../schematics/templates/business/interfaces';

export class BusinessModule extends BaseModule {
    schematics: Schematics;

    constructor(spinner?: ora) {
        super(spinner);
        this.schematics = new Schematics();
    }

    create(modelName: string, callback: BaseCallback): void {
        modelName = modelName.replace(/Business/g, '');

        var modelPath = path.join(process.cwd(), this.config['modelPath']['main']);
        var repositoryInterfacesPath = path.join(process.cwd(), this.config['repositoryPath']['interfaces']);
        var repositoryPath = path.join(process.cwd(), this.config['repositoryPath']['main']);
        var businessInterfacesPath = path.join(process.cwd(), this.config['businessPath']['interfaces']);
        var businessPath = path.join(process.cwd(), this.config['businessPath']['main']);

        var modelExtension = ValidateService.capitalizeFirstLetter(modelName)  + this.config['modelPath']['suffixExtension'];
        var repositoryInterfaceExtension = 'I' + ValidateService.capitalizeFirstLetter(modelName)  + this.config['repositoryPath']['suffixExtension'];
        var repositoryExtension = ValidateService.capitalizeFirstLetter(modelName)  + this.config['repositoryPath']['suffixExtension'];
        var businessInterfaceExtension = 'I' + ValidateService.capitalizeFirstLetter(modelName)  + this.config['businessPath']['suffixExtension'];
        var businessExtension = ValidateService.capitalizeFirstLetter(modelName)  + this.config['businessPath']['suffixExtension'];

        if(!fs.existsSync(path.join(modelPath, modelExtension))){
            callback(this.response.setError('Couldn´t find model', `Coudn´t find a model with the name ${modelName} at ${path.join(modelPath, modelExtension)}`));
        }
        else if(!fs.existsSync(path.join(repositoryInterfacesPath, repositoryInterfaceExtension))){
            callback(this.response.setError('Couldn´t find repository interface', `Coudn´t find a repository interface with the name ${repositoryInterfaceExtension} at ${path.join(repositoryInterfacesPath, repositoryInterfaceExtension)}`));
        }
        else if(!fs.existsSync(path.join(repositoryPath, repositoryExtension))){
            callback(this.response.setError('Couldn´t find repository', `Coudn´t find a repository interface with the name ${repositoryExtension} at ${path.join(repositoryPath, repositoryExtension)}`));
        }
        else if(fs.existsSync(path.join(businessInterfacesPath, businessInterfaceExtension))){
            callback(this.response.setError('Already exists business interface', `Already exists a business interface ${path.join(businessInterfacesPath, businessInterfaceExtension)}`));
        }
        else if(fs.existsSync(path.join(businessPath, businessExtension))){
            callback(this.response.setError('Already exists business', `Already exists a business ${path.join(businessPath, businessExtension)}`));
        }
        else{
            if (this.schematics.createFile(businessInterfacesPath, this._createBusinessInterfaceFileTemplate(modelName), businessInterfaceExtension)) {

                if (this.schematics.createFile(businessPath, this._createBusinessFileTemplate(modelName), businessExtension)) {
                   
                    this.addStartupService(businessInterfaceExtension, businessExtension, (startupResponse) => {

                        if(startupResponse.data){
                            var logStartup = startupResponse.data == true? '' : '\n' + startupResponse.data;
                            callback(this.response.setData(`<create/> ${path.join(businessInterfacesPath, businessInterfaceExtension)}\n<create/> ${path.join(businessPath, businessExtension)}` + logStartup));
                        }
                        else{
                            callback(this.response.setData(`<create/> ${path.join(businessInterfacesPath, businessInterfaceExtension)}\n<create/> ${path.join(businessPath, businessExtension)}`));
                        }
                    });
                }
                else{
                    callback(this.response.setError('Fail to create business', ' Could not create the business'));
                }
            }
            else{
                callback(this.response.setError('Fail to create business interface', ' Could not create the business interface'));
            }
        }
    }
 
    private _createBusinessInterfaceFileTemplate(modelName: string): string {
        return iBusinessTemplate(this.config['Project']['name'], modelName);
    }

    private _createBusinessFileTemplate(modelName: string): string {
        return businessTemplate(this.config['Project']['name'], modelName);
    }
}