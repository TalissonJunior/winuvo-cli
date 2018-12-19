export class BaseResponse {
    data: any;
    error: ErrorResponse;

    constructor(data: any = null) {
        if (data != null) {
            this.data = data;
        }
        else {
            this.error = new ErrorResponse();
        }
    }

    public setData(data: any): BaseResponse {
        this.data = data;
        this.error.code = null;
        this.error.message = null;
        return this;
    }

    public setError(code: string, message: string): BaseResponse {
        this.data = null;
        this.error.code = code;
        this.error.message = message;
        return this;
    }
}

class ErrorResponse {
    code: string;
    message: string;
}