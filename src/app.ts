import * as program from 'commander';
import * as json from '../package.json';
import { NewCommand } from './commands';
import { Log } from './utilities';
import { ProjectOptions, ProjectValidator } from './modules';
import { GenerateType, ProjectType } from './enums';

class App {
    private newCommand: NewCommand;

    constructor() {
        this.newCommand = new NewCommand();
        this.initialize();
    }

    initialize(): void {

        program
            .version((<any>json).version)
            .description((<any>json).description);

        // NEW COMMAND
        program
            .command("new [<name>]")
            .alias('n')
            .option('--type <name>', 'Type of project to create, "full"')
            .option('--connectionString <connection>', 'The database connection string, "example"')
            .description('Creates a new project.')
            .action((name: string, options: any) => {
                this.newCommand.spinner.start('Validating project name...');

                if (!name) {
                    this.newCommand.spinner.fail();
                    Log.error('You must provide a project name.');
                }

                var invalidCharacters = ProjectValidator.validateName(name);
          
                if (invalidCharacters) {
                    this.newCommand.spinner.fail();
                    Log.error(`Your project name can´t contain "${ProjectValidator.validateName(name)}" .`);
                }

                this.newCommand.spinner.succeed();
                this.newCommand.spinner.text = `Validating options...`; this.newCommand.spinner.start();
                this.newCommand.spinner.start();
                options.type = options.type || ProjectType.FULL;

                if (!ProjectValidator.hasValidOptionType(options.type)) {
                    this.newCommand.spinner.fail();
                    Log.error("Invalid type of project");
                }

                this.newCommand.spinner.succeed();
                var projectOptions = new ProjectOptions();
                projectOptions.name = name;
                projectOptions.type = options.type;

                this.newCommand.spinner.text = `Creating ${projectOptions.type} project "${name}"...`;
                this.newCommand.spinner.start();

                this.newCommand.createProject(projectOptions, (response: BaseResponse) => {
               
                    if (response.data) {
                        this.newCommand.spinner.text = `Successfully created project "${name}"`;
                        this.newCommand.spinner.succeed();
                    }
                    else {
                        this.newCommand.spinner.text = response.error.code;
                        this.newCommand.spinner.fail();
                        Log.highlightError(response.error.message);
                    }
                });

            });// End action;

        // GENERATE COMMAND
        program
            .command("generate [<type>] [<name>]")
            .alias('g')
            .description('Generates model, repository, business or controller.')
            .action((type: GenerateType, name: string) => {

                if (type === GenerateType.MODEL || type === GenerateType.MODEL_ALIAS) {
                    Log.info(name);
                }
            });

        // INVALID COMMANDS
        program
            .on('command:*', () => {
                Log.error('Command not found.');
            });

        program.parse(process.argv);

    }
}

export default new App();