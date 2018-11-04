import * as path from 'path';
import * as fs from 'fs';

export class ValidateService {

    constructor() { }

    static isInsideDotNetCoreProject(): boolean {
        let InvalidPathException = {};
        let response: boolean = true;
        let dotNetCoreProjectStructure = [
            'Properties',
            'appsettings.json',
            'Program.cs',
            'Startup.cs'
        ];

        try {
            dotNetCoreProjectStructure.forEach((p) => {
                if (!fs.existsSync(path.resolve(process.cwd(), p))) {
                    throw InvalidPathException;
                }
            });
        }
        catch (e) {
            if (e !== InvalidPathException) throw e;
            else response = false;
        }

        return response;
    }

    static capitalizeFirstLetter(value: string): string {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

}