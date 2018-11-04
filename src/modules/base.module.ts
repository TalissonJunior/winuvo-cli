import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { BaseResponse, Log } from "../utilities";
import { ValidateService } from '../services';

export class BaseModule {
    protected response: BaseResponse; 
    protected spinner: ora;
    protected config: any;

    constructor(spinner?: ora){
        this.response = new BaseResponse();
        if(this.spinner){
            this.spinner = spinner;
        }
        else {
            this.spinner = new ora();
        }

        this.getWinuvoJsonConfig();
    }

    private getWinuvoJsonConfig() {
        if(ValidateService.isInsideDotNetCoreProject()){
            
            var winuvoJSONPath = path.join(process.cwd(), 'winuvo.json'); 

            try {
                this.config = JSON.parse(fs.readFileSync(winuvoJSONPath, 'utf8'));
            }
            catch{
                this.spinner.fail();
                Log.error('Couldn´t find "winuvo.json" on the root directory.');
                process.exit();
            }
        }
    }
}