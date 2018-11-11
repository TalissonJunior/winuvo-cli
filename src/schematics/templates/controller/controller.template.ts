import { ValidateService } from "../../../services";

export const controllerTemplate = (projectName: string, className: string, modelName: string): string => {
    return `using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ${projectName}.Business.Enums;
using ${projectName}.Business.Interfaces;
using ${projectName}.Models.Database;
using ${projectName}.Business.Utilities;

namespace ${projectName}.Controllers
{
    [Route("api/[controller]")]
    public class ${ValidateService.capitalizeFirstLetter(className)}Controller : Controller
    {
        private I${ValidateService.capitalizeFirstLetter(className)}Business _business;
        private BaseResponse _baseResponse;

        public ${ValidateService.capitalizeFirstLetter(className)}Controller(I${ValidateService.capitalizeFirstLetter(className)}Business ${ValidateService.lowercaseFirstLetter(className)}Business)
        {
            _business = ${ValidateService.lowercaseFirstLetter(className)}Business;
            _baseResponse = new BaseResponse();
        }

        #region Base Methods

        [HttpGet]
        public BaseResponse getAll()
        {
            return _baseResponse.setData(_business.getAllAsync().Result);
        }

        [HttpGet("{id}")]
        public BaseResponse getById(int id)
        {
            return _baseResponse.setData(_business.getAsync(id).Result);
        }

        [HttpPost]
        public object insert([FromBody] ${ValidateService.capitalizeFirstLetter(modelName)} model)
        {
            object result = _validateModel();
            return result == null ? _baseResponse.setData(_business.insertAsync(model).Result) : result;
        }

        [HttpPost("all")]
        public object insert([FromBody] List<${ValidateService.capitalizeFirstLetter(modelName)}> models)
        {
            object result = _validateModel();
            return result == null ? _baseResponse.setData(_business.insertAsync(models).Result) : result;
        }

        [HttpPut]
        public object edit([FromBody] ${ValidateService.capitalizeFirstLetter(modelName)} model)
        {
            object result = _validateModel();
            return result == null ? _business.updateAsync(model).Result : result;
        }

        [HttpPut("all")]
        public object edit([FromBody] List<${ValidateService.capitalizeFirstLetter(modelName)}> models)
        {
             object result = _validateModel();
             return result == null ? _business.updateAsync(models).Result : result;
        }

        [HttpDelete("{id}")]
        public object delete(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    code = BaseResponseCode.BAD_REQUEST,
                    message = BaseResponseMessage.INVALID_ID
                });
            }
            var model = new ${ValidateService.capitalizeFirstLetter(modelName)}() { id = id };
             return _baseResponse.setData(_business.deleteAsync(model).Result);
        }


        [HttpPost("delete/all")]
        public object delete([FromBody] List<${ValidateService.capitalizeFirstLetter(modelName)}> models)
        {
            try
            {
                bool result = _business.deleteAsync(models).Result;

                return result == true ? _baseResponse.setData(result) : _baseResponse.setError(BaseResponseCode.NOT_DATA_TO_EXCLUDE, BaseResponseMessage.NOT_DATA_TO_EXCLUDE);
            }
            catch (Exception e)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, e.Message);
            }

        }
        #endregion

        private object _validateModel(){
            if(!ModelState.IsValid){
                return BadRequest(new
                {
                    code = BaseResponseCode.BAD_REQUEST,
                    message = BaseResponseMessage.BAD_REQUEST
                });
            }
            return null;
        }

    }
}`;
};


