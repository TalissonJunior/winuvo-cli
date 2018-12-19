import { BaseCommand } from "../base.command";
import { Project} from "../../modules";
import { ProjectOptions } from "../../models";

export class NewCommand extends BaseCommand {
    project: Project;

    constructor() {
        super();
        this.project = new Project(this.spinner);
    }

    createProject(options: ProjectOptions, callback: BaseCallback): void {
        this.project.create(options, callback);
    }

}