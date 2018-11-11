import { BaseCommand } from "../base.command";
import { ModelOptions } from "../../models";
import { ModelModule, RepositoryModule, BusinessModule, ControllerModule } from "../../modules";

export class GenerateCommand extends BaseCommand {
    model: ModelModule;
    repository: RepositoryModule;
    business: BusinessModule;
    controller: ControllerModule;

    constructor() {
        super();
        this.model = new ModelModule(this.spinner);
        this.repository = new RepositoryModule(this.spinner);
        this.business = new BusinessModule(this.spinner);
        this.controller = new ControllerModule(this.spinner);
    }

    generateModel(options: ModelOptions, callback: BaseCallback): void {
        this.model.create(options, callback);
    }

    generateRepository(name: string, modelName: string, callback: BaseCallback): void {
        this.repository.create(name, modelName, callback);
    }

    generateBusiness(name: string, modelName: string, callback: BaseCallback): void {
        this.business.create(name, modelName, callback);
    }

    generateController(name: string, modelName: string, callback: BaseCallback): void {
        this.controller.create(name, modelName, callback);
    }

}