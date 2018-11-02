import * as fs from 'fs';
import * as ora from 'ora';

export class BaseCommand {
    public spinner: ora;

    constructor() {
        this.spinner = new ora();
    }

    protected getFileSizeInBytes(filePath: string): number {
        return fs.statSync(filePath)["size"];
    }
}