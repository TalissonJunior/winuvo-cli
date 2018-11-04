interface ErrorResponse {
    code: string;
    message: string;
}

interface BaseResponse {
    data: any;
    error: ErrorResponse;
}

interface BaseCallback { 
    (response: BaseResponse): void; 
}

interface BooleanCallback { 
    (response: boolean): void; 
}