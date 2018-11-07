import * as ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import * as stream from 'stream';
import { BaseResponse, Log } from "../utilities";
import { ValidateService } from '../services';
import { Schematics } from '../schematics/schematics';

export class BaseModule {
    protected response: BaseResponse;
    protected spinner: ora;
    protected config: any;
    protected schematics: Schematics;

    constructor(spinner?: ora) {
        this.response = new BaseResponse();
        this.schematics = new Schematics();
        if (this.spinner) {
            this.spinner = spinner;
        }
        else {
            this.spinner = new ora();
        }

        this.getWinuvoJsonConfig();
    }

    /**
     * 
     * @param interfaceClasse 'INameRepository | IUserBusiness | IUserTeste'
     * @param classe 'NameRepository | UserBusiness | UserTeste'
     */
    addStartupService(interfaceClasse: string, classe: string, callback: BaseCallback) {
        var startupPath = path.join(process.cwd(), 'Startup.cs');

        let instream = fs.createReadStream(startupPath),
            rl = readline.createInterface(instream, new stream.Writable);

        var serviceTemplate = `\t\t\tservices.AddTransient<${path.parse(interfaceClasse).name}, ${path.parse(classe).name}>();`;

        try {
            var data = fs.readFileSync(startupPath, 'utf8');

            if (data.indexOf(serviceTemplate) > -1) {
                callback(this.response.setData(true));
            }
            else {
                var addServiceMVC = 'services.AddMvc()';
                data = this.schematics.addAfterKeyword(data, serviceTemplate, addServiceMVC);

                if (this.schematics.createFile(startupPath, data)) {
                    callback(this.response.setData(`<update/> ${startupPath}`));
                }
                else {
                    callback(this.response.setError('Fail to update file', `Couldn't update file ${startupPath}`));
                }
            }
        }
        catch {
            callback(this.response.setError('Fail find file', `Couldn't find file ${startupPath}`));
        }
    }

    private getWinuvoJsonConfig() {
        if (ValidateService.isInsideDotNetCoreProject()) {

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