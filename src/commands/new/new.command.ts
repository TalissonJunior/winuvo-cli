import { BaseCommand } from "../base.command";
import { Project} from "../../modules";
import { ProjectOptions } from "../../models";

export class NewCommand extends BaseCommand {
    project: Project = new Project();

    constructor() {
        super();
    }

    createProject(options: ProjectOptions, callback: BaseCallback): void {
        this.project.create(options, callback);
    }

}