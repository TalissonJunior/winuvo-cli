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

    create(name: string, modelName: string, callback: BaseCallback): void {
        modelName = modelName.replace(/Controller/g, '');

        var modelPath = path.join(process.cwd(), this.config['modelPath']['main']);
        var businessInterfacesPath = path.join(process.cwd(), this.config['businessPath']['interfaces']);
        var businessPath = path.join(process.cwd(), this.config['businessPath']['main']);
        var controllerPath = path.join(process.cwd(), this.config['controllerPath']['main']);

        var modelNameWithExtension = ValidateService.capitalizeFirstLetter(modelName) + this.config['modelPath']['suffixExtension'];
        var businessInterfaceNameWithExtension = 'I' + ValidateService.capitalizeFirstLetter(name) + this.config['businessPath']['suffixExtension'];
        var businessNameWithExtension = ValidateService.capitalizeFirstLetter(name) + this.config['businessPath']['suffixExtension'];
        var controllerNameWithExtension = ValidateService.capitalizeFirstLetter(name) + this.config['controllerPath']['suffixExtension'];

        if (!fs.existsSync(path.join(modelPath, modelNameWithExtension))) {
            callback(this.response.setError('Couldn´t find model', `Coudn´t find a model with the name ${modelName} at ${path.join(modelPath, modelNameWithExtension)}`));
        }
        else if (!fs.existsSync(path.join(businessInterfacesPath, businessInterfaceNameWithExtension))) {
            callback(this.response.setError('Couldn´t find business interface', `Coudn´t find a business interface with the name ${businessInterfaceNameWithExtension} at ${path.join(businessInterfacesPath, businessInterfaceNameWithExtension)}`));
        }
        else if (!fs.existsSync(path.join(businessPath, businessNameWithExtension))) {
            callback(this.response.setError('Couldn´t find business', `Coudn´t find a business with the name ${businessNameWithExtension} at ${path.join(businessPath, businessNameWithExtension)}`));
        }
        else {
            if (this.schematics.createFile(controllerPath, this._createControllerFileTemplate(name, modelName), controllerNameWithExtension)) {

                this._generateFullMethods(controllerNameWithExtension, businessInterfaceNameWithExtension, () => {
                    callback(this.response.setData(`<create/> ${path.join(controllerPath, controllerNameWithExtension)}`));
                });
            }
            else {
                callback(this.response.setError('Fail to create controller', ' Could not create the controller'));
            }


        }
    }

    private _generateFullMethods(controllerNameWithExtension: string, businessInterfaceNameWithExtension: string, callback: BaseCallback) {

        var businessInterfacePath = path.join(process.cwd(), this.config['businessPath']['interfaces']);
        var controllerPath = path.join(process.cwd(), this.config['controllerPath']['main']);
        var controllerPathWithNameAndExtension = path.join(controllerPath, controllerNameWithExtension);

        fs.readFile(path.join(businessInterfacePath, businessInterfaceNameWithExtension), 'utf8', (err: NodeJS.ErrnoException, fileData: string) => {

            if (err) {
                callback(this.response.setError('Fail to generate insert full', `Could not find business interface ${path.join(businessInterfacePath, businessInterfaceNameWithExtension)}`));
            }

            var viewModelName = this.schematics.getStringBetween(fileData, 'insertFull(', 'model)');
            var viewModelInsertFullAllName = this.schematics.getStringBetween(fileData, 'insertFullAll(', 'models)');
            var viewModelGetAllFullName = fileData.indexOf('getAllFull');
            var viewModelGetFullByIdName = fileData.indexOf('getFullById');
            var viewModelEditFullName = this.schematics.getStringBetween(fileData, 'editFull(', 'model)');
            var viewModelEditFullAlllName = this.schematics.getStringBetween(fileData, 'editFullAll(', 'models)');
            var fileData = '';
            var template = '';

            if (viewModelGetAllFullName > -1) {
                template = this._generateGetAllFullTemplate();

                fileData = fs.readFileSync(controllerPathWithNameAndExtension, 'utf8');

                this.schematics.createFile(controllerPathWithNameAndExtension, this.schematics.addDataToClassBody(fileData, template));
            }
            else {
                callback(this.response.setError('Fail to generate "getAllFull" method', `Could not find "getAllFull" method at ${path.join(businessInterfacePath, businessInterfaceNameWithExtension)}`));
            }

            if (viewModelGetFullByIdName > -1) {
                template = this._generateGetFullByIdTemplate();

                fileData = fs.readFileSync(controllerPathWithNameAndExtension, 'utf8');

                this.schematics.createFile(controllerPathWithNameAndExtension, this.schematics.addDataToClassBody(fileData, template));
            }
            else {
                callback(this.response.setError('Fail to generate "getFullById" method', `Could not find "getFullById" method at ${path.join(businessInterfacePath, businessInterfaceNameWithExtension)}`));
            }
            
            if (viewModelName) {
                var insertFullMethodTemplate = this._generateInsertFullTemplate(viewModelName);

                fileData = fs.readFileSync(controllerPathWithNameAndExtension, 'utf8');

                this.schematics.createFile(controllerPathWithNameAndExtension, this.schematics.addDataToClassBody(fileData, insertFullMethodTemplate));
            }
            else {
                callback(this.response.setError('Fail to generate "insertFull" method', `Could not find "insertFull" method at ${path.join(businessInterfacePath, businessInterfaceNameWithExtension)}`));
            }

            if (viewModelInsertFullAllName) {
                var insertFullAllMethodTemplate = this._generateInsertFullAllTemplate(viewModelInsertFullAllName);

                fileData = fs.readFileSync(controllerPathWithNameAndExtension, 'utf8');

                this.schematics.createFile(controllerPathWithNameAndExtension, this.schematics.addDataToClassBody(fileData, insertFullAllMethodTemplate));
            }
            else {
                callback(this.response.setError('Fail to generate "insertFullAll" method', `Could not find "insertFullAll" method at ${path.join(businessInterfacePath, businessInterfaceNameWithExtension)}`));
            }

            if (viewModelEditFullName) {
                var editFullMethodTemplate = this._generateEditFullTemplate(viewModelEditFullName);

                fileData = fs.readFileSync(controllerPathWithNameAndExtension, 'utf8');

                this.schematics.createFile(controllerPathWithNameAndExtension, this.schematics.addDataToClassBody(fileData, editFullMethodTemplate));
            }
            else {
                callback(this.response.setError('Fail to generate "editFull" method', `Could not find "editFull" method at ${path.join(businessInterfacePath, businessInterfaceNameWithExtension)}`));
            }

            if (viewModelEditFullAlllName) {
                var editFullAllMethodTemplate = this._generateEditFullAllTemplate(viewModelEditFullAlllName);

                fileData = fs.readFileSync(controllerPathWithNameAndExtension, 'utf8');

                this.schematics.createFile(controllerPathWithNameAndExtension, this.schematics.addDataToClassBody(fileData, editFullAllMethodTemplate));
            }
            else {
                callback(this.response.setError('Fail to generate "editFullAll" method', `Could not find "editFullAll" method at ${path.join(businessInterfacePath, businessInterfaceNameWithExtension)}`));
            }

            callback(this.response.setData(true));
        });
    }

    private _createControllerFileTemplate(className: string, modelName: string): string {
        return controllerTemplate(this.config['Project']['name'], className, modelName);
    }

    private _generateGetAllFullTemplate(): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var templateContent = `${T + T}[HttpGet("full")]${N}`;

        templateContent += `${T + T}public BaseResponse getAllFull()${N +
            T + T}{${N +
            T + T + T}return _business.getAllFull();${N +
            T + T}}${N}`;

        return templateContent;
    }

    private _generateGetFullByIdTemplate(): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var templateContent = `${T + T}[HttpGet("full/{id}")]${N}`;

        templateContent += `${T + T}public BaseResponse getFullById(int id)${N +
            T + T}{${N +
            T + T + T}return _business.getFullById(id);${N +
            T + T}}${N}`;

        return templateContent;
    }

    private _generateInsertFullTemplate(viewModelName: string): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var templateContent = `${T + T}[HttpPost("full")]${N}`;

        templateContent += `${T + T}public ActionResult<BaseResponse> insertFull([FromBody] ${viewModelName.trim()} model)${N}`;

        templateContent += `${
            T + T}{${N +
            T + T + T}if (!ModelState.IsValid)${N +
            T + T + T}{${N +
            T + T + T + T}return BadRequest(new BaseResponse().setError(${N +
            T + T + T + T + T}BaseResponseCode.BAD_REQUEST,${N +
            T + T + T + T + T}string.Join("; ", ModelState.Values${N +
            T + T + T + T + T + T}.SelectMany(x => x.Errors)${N +
            T + T + T + T + T + T}.Select(x => x.ErrorMessage))${N +
            T + T + T + T}));${N +
            T + T + T}}${N + N +
            T + T + T}return _business.insertFull(model);${N +
            T + T}}`;

        return templateContent;
    }

    private _generateInsertFullAllTemplate(viewModelName: string): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var templateContent = `${N + T + T}[HttpPost("full/all")]${N}`;

        templateContent += `${T + T}public ActionResult<BaseResponse> insertFullAll([FromBody] ${viewModelName.trim()} models)${N}`;

        templateContent += `${
            T + T}{${N +
            T + T + T}if (!ModelState.IsValid)${N +
            T + T + T}{${N +
            T + T + T + T}return BadRequest(new BaseResponse().setError(${N +
            T + T + T + T + T}BaseResponseCode.BAD_REQUEST,${N +
            T + T + T + T + T}string.Join("; ", ModelState.Values${N +
            T + T + T + T + T + T}.SelectMany(x => x.Errors)${N +
            T + T + T + T + T + T}.Select(x => x.ErrorMessage))${N +
            T + T + T + T}));${N +
            T + T + T}}${N + N +
            T + T + T}return _business.insertFullAll(models);${N +
            T + T}}`;

        return templateContent;
    }

    private _generateEditFullTemplate(viewModelName: string): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var templateContent = `${N + T + T}[HttpPut("full")]${N}`;

        templateContent += `${T + T}public ActionResult<BaseResponse> editFull([FromBody] ${viewModelName.trim()} model)${N}`;

        templateContent += `${
            T + T}{${N +
            T + T + T}if (!ModelState.IsValid)${N +
            T + T + T}{${N +
            T + T + T + T}return BadRequest(new BaseResponse().setError(${N +
            T + T + T + T + T}BaseResponseCode.BAD_REQUEST,${N +
            T + T + T + T + T}string.Join("; ", ModelState.Values${N +
            T + T + T + T + T + T}.SelectMany(x => x.Errors)${N +
            T + T + T + T + T + T}.Select(x => x.ErrorMessage))${N +
            T + T + T + T}));${N +
            T + T + T}}${N + N +
            T + T + T}return _business.editFull(model);${N +
            T + T}}`;

        return templateContent;
    }

    private _generateEditFullAllTemplate(viewModelName: string): string {
        const N = "\n"; //Break line
        const T = "\t"; //Tab line
        var templateContent = `${N + T + T}[HttpPut("full/all")]${N}`;

        templateContent += `${T + T}public ActionResult<BaseResponse> editFullAll([FromBody] ${viewModelName.trim()} models)${N}`;

        templateContent += `${
            T + T}{${N +
            T + T + T}if (!ModelState.IsValid)${N +
            T + T + T}{${N +
            T + T + T + T}return BadRequest(new BaseResponse().setError(${N +
            T + T + T + T + T}BaseResponseCode.BAD_REQUEST,${N +
            T + T + T + T + T}string.Join("; ", ModelState.Values${N +
            T + T + T + T + T + T}.SelectMany(x => x.Errors)${N +
            T + T + T + T + T + T}.Select(x => x.ErrorMessage))${N +
            T + T + T + T}));${N +
            T + T + T}}${N + N +
            T + T + T}return _business.editFullAll(models);${N +
            T + T}}`;

        return templateContent;
    }
}