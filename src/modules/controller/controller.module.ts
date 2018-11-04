import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { BaseModule } from "../base.module";
import { Schematics } from '../../schematics/schematics';
import { ValidateService } from '../../services';
import { controllerTemplate } from '../../schematics/templates/controller/controller.template';

export class ControllerModule extends BaseModule {
    schematics: Schematics;

    constructor(spinner?: ora) {
        super(spinner);
        this.schematics = new Schematics();
    }

    create(modelName: string, callback: BaseCallback): void {
        modelName = modelName.replace(/Controller/g, '');

        var modelPath = path.join(process.cwd(), this.config['modelPath']['main']);
        var businessInterfacesPath = path.join(process.cwd(), this.config['businessPath']['interfaces']);
        var businessPath = path.join(process.cwd(), this.config['businessPath']['main']);
        var controllerPath = path.join(process.cwd(), this.config['controllerPath']['main']);

        var modelExtension = ValidateService.capitalizeFirstLetter(modelName)  + this.config['modelPath']['suffixExtension'];
        var businessInterfaceExtension = 'I' + ValidateService.capitalizeFirstLetter(modelName)  + this.config['businessPath']['suffixExtension'];
        var businessExtension = ValidateService.capitalizeFirstLetter(modelName)  + this.config['businessPath']['suffixExtension'];
        var controllerExtension = ValidateService.capitalizeFirstLetter(modelName)  + this.config['controllerPath']['suffixExtension'];

        if(!fs.existsSync(path.join(modelPath, modelExtension))){
            callback(this.response.setError('Couldn´t find model', `Coudn´t find a model with the name ${modelName} at ${path.join(modelPath, modelExtension)}`));
        }
        else if(!fs.existsSync(path.join(businessInterfacesPath, businessInterfaceExtension))){
            callback(this.response.setError('Couldn´t find business interface', `Coudn´t find a business interface with the name ${businessInterfaceExtension} at ${path.join(businessInterfacesPath, businessInterfaceExtension)}`));
        }
        else if(!fs.existsSync(path.join(businessPath, businessExtension))){
            callback(this.response.setError('Couldn´t find business', `Coudn´t find a business with the name ${businessExtension} at ${path.join(businessPath, businessExtension)}`));
        }
        else{
            if (this.schematics.createFile(controllerPath, this._createControllerFileTemplate(modelName), controllerExtension)) {
                callback(this.response.setData(`<create/> ${path.join(controllerPath, controllerExtension)}`));
            }
            else{
                callback(this.response.setError('Fail to create controller', ' Could not create the controller'));
            }
        }
    }

    private _createControllerFileTemplate(modelName: string): string {
        return controllerTemplate(this.config['Project']['name'], modelName);
    }
}