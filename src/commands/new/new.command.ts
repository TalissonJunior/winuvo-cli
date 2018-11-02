import { BaseCommand } from "../base.command";
import { Project, ProjectOptions} from "../../modules";

export class NewCommand extends BaseCommand {
    project: Project = new Project();

    constructor() {
        super();
    }

    createProject(options: ProjectOptions, callback: BaseCallback): void {
        this.project.create(options, callback);
    }

}