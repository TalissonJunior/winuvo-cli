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

    static lowercaseFirstLetter(value: string): string {
        return value.charAt(0).toLowerCase() + value.slice(1);
    }

    static transformStringToCamelCase(value: string): string {
        value = value.replace(/[.*+?^${}()-_@|[\]\\]/g, ';');

        var arrayValues = value.split(';');

        arrayValues = arrayValues.map((value) => this.capitalizeFirstLetter(value));

        return arrayValues.join('');
    }

    /**
     * @description The value must be a string separated by '_', it will not return names that are
     * only numbers, only vogals or consoants, and won´t return string that starts with number
     * @example 'fk_ttt_aaa_1teste_user_teste2_id' -> returns 'userTeste2';
     * @param value 
     */
    static getTheForeignKeyName(value: string): string {
        var arrayValues = value.split('_');
        var regexVogal = /[aeiou]/i;
        var regexConsoant = /[bcdfghjklmnpqrstvxzyw]/i;

        arrayValues = arrayValues.filter((value) => {

            // Teste if is bigger the 2 if is not only numbers;
            if (value.length > 2 && !(/^\d+$/.test(value))) {

                var hasVogal = false;
                var hasConsoant = false;

                for (var i = 0; i < value.length; i++) {
                    if (regexVogal.test(value.charAt(i))) {
                        hasVogal = true;
                    }
                    if (regexConsoant.test(value)) {
                        hasConsoant = true;
                    }

                    if (hasVogal && hasConsoant) {
                       break;
                    }
                }

               if(hasVogal && hasConsoant && !(/^\d+$/.test(value.charAt(0)))){
                   return true;
               }
            }
        });

        arrayValues = arrayValues.map((value) => this.capitalizeFirstLetter(value));
        
        return this.lowercaseFirstLetter(arrayValues.join(""));
    }

}