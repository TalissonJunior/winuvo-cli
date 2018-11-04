import { BaseCommand } from "../base.command";
import { ModelOptions } from "../../models";
import { Model } from "../../modules";

export class GenerateCommand extends BaseCommand {
    model: Model;

    constructor() {
        super();
        this.model = new Model(this.spinner);
    }

    createModel(options: ModelOptions, callback: BaseCallback): void {
        this.model.create(options, callback);
    }

}