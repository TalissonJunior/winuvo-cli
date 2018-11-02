import * as ora from 'ora';
import { BaseResponse } from "../utilities";

export class BaseModule {
    protected response: BaseResponse; 
    protected spinner: ora;

    constructor(){
        this.response = new BaseResponse();
        this.spinner = new ora();
    }
}