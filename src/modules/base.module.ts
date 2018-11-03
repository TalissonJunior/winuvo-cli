import * as ora from 'ora';
import { BaseResponse } from "../utilities";

export class BaseModule {
    protected response: BaseResponse; 
    protected spinner: ora;

    constructor(spinner?: ora){
        this.response = new BaseResponse();
        if(this.spinner){
            this.spinner = spinner;
        }
        else {
            this.spinner = new ora();
        }
    }
}