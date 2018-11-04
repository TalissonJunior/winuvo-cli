import * as path from 'path';
import * as program from 'commander';
import * as json from '../package.json';
import { NewCommand, GenerateCommand } from './commands';
import { Log } from './utilities';
import { ProjectValidator } from './modules';
import { GenerateType, ProjectType } from './enums';
import { ProjectOptions, ModelOptions } from './models';
import { ValidateService } from './services';

class App {
    private newCommand: NewCommand;
    private generateCommand: GenerateCommand;

    constructor() {
        this.newCommand = new NewCommand();
        this.generateCommand = new GenerateCommand();
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
                projectOptions.connectionString = options.connectionString;

                this.newCommand.spinner.text = `Creating ${projectOptions.type} project "${name}"...`;
                this.newCommand.spinner.start();

                this.newCommand.createProject(projectOptions, (response: BaseResponse) => {

                    if (response.data) {
                        this.newCommand.spinner.succeed();
                        this.newCommand.spinner.text = `Successfully created ${projectOptions.type} project "${name}"`;
                        this.newCommand.spinner.succeed();
                    }
                    else {
                        this.newCommand.spinner.text = response.error.code;
                        this.newCommand.spinner.fail();
                        Log.highlightError(response.error.message);
                    }

                    process.exit();
                });

            });// End action;

        // GENERATE COMMAND
        program
            .command("generate [<type>] [<name>]")
            .alias('g')
            .option('--table <name>', 'Table name')
            .description('Generates model, repository, business or controller.')
            .action((type: GenerateType, name: string, options: any) => {

                if (ValidateService.isInsideDotNetCoreProject()) {

                    if (type === GenerateType.MODEL || type === GenerateType.MODEL_ALIAS) {
                        this.generateCommand.spinner.start(`Creating model ${name || ''}...`);

                        if (!name) {
                            this.generateCommand.spinner.fail();
                            Log.error('You must provide a model name. --model=your-model-name');
                        }

                        var modelOptions = new ModelOptions();
                        modelOptions.name = name;
                        modelOptions.table = options.table || modelOptions.name.toLowerCase();

                        this.generateCommand.createModel(modelOptions, (response) => {

                            if (response.data) {
                                this.generateCommand.spinner.succeed();
                                this.generateCommand.spinner.text = `Successfully created model "${name}"`;
                                this.generateCommand.spinner.succeed();
                            }
                            else {
                                this.generateCommand.spinner.text = response.error.code;
                                this.generateCommand.spinner.fail();
                                Log.highlightError(response.error.message);
                            }

                            process.exit();
                        });
                    }
                }
                else {
                    Log.highlightError('You are not in a root "dotnet core" project directory, \n Run: @!"winuvo new your-project-name --connectionString=your-connection"!@ to create a new one.');
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