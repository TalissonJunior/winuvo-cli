
import { BaseCommand } from "../base.command";
import { exec } from "child_process";
import { BaseResponse } from "../../utilities";

export class EditorCommand extends BaseCommand {
    response: BaseResponse;

    constructor() {
        super();
        this.response = new BaseResponse();
    }

    start(callback: BaseCallback): void {
        exec('npm run electron', (error: Error) => {
            if (error) {
                callback(this.response.setError(error.name, error.message));
            }
            else {
                callback(this.response.setData(true));
            }
        });
    }

}