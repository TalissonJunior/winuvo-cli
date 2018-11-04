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

    generateRepository(modelName: string, callback: BaseCallback): void {
        this.repository.create(modelName, callback);
    }

    generateBusiness(modelName: string, callback: BaseCallback): void {
        this.business.create(modelName, callback);
    }

    generateController(modelName: string, callback: BaseCallback): void {
        this.controller.create(modelName, callback);
    }

}