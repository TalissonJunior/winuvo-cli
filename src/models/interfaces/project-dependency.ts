export interface ProjectDependency {
    /**
     * Identifier, usually the name of the dependency
     */
    name: string;
    /**
     * The error message to be displayed in order to help user solve the dependency problem;
     */
    errorMessage: string;
    /**
     * The command to execute in order to verify if the dependency is installed on the user machine;
     */
    command: string;
}