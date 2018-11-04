using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace webapi.Business.Utilities
{
    public class BaseResponse
    {
        public ErrorResponse error { get; set; }

        public object data { get; set; }

        public BaseResponse(object data = null)
        {
            if (data != null)
            {
                this.data = data;
            }
            else
            {
                error = new ErrorResponse();
            }
        }

        public BaseResponse setError(string code, string message){
            this.error.code = code;
            this.error.message = message;
            this.data = null;
            return this;
        }

         public BaseResponse setData(object data){
            this.error.code = String.Empty;
            this.error.message = String.Empty;
            this.data = data;
            return this;
        }
    }

    public class ErrorResponse
    {
        public string code { get; set; }
        public string message { get; set; }
    }
}