import { ValidateService } from "../../../services";

export const controllerTemplate = (projectName: string, className: string, modelName: string): string => {
    return `using System;
using System.Linq;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using ${projectName}.Business.Enums;
using ${projectName}.Business.Interfaces;
using ${projectName}.Models.Database;
using ${projectName}.Models.ViewModels;
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
        
        public ActionResult<BaseResponse> insert([FromBody] ${ValidateService.capitalizeFirstLetter(modelName)} model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new BaseResponse().setError(
                    BaseResponseCode.BAD_REQUEST,
                    string.Join("; ", ModelState.Values
                        .SelectMany(x => x.Errors)
                        .Select(x => x.ErrorMessage))
                ));
            }

            return _baseResponse.setData(_business.insertAsync(model));
        }

        [HttpPost("all")]
        public ActionResult<BaseResponse> insert([FromBody] List<${ValidateService.capitalizeFirstLetter(modelName)}> models)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new BaseResponse().setError(
                    BaseResponseCode.BAD_REQUEST,
                    string.Join("; ", ModelState.Values
                        .SelectMany(x => x.Errors)
                        .Select(x => x.ErrorMessage))
                ));
            }
            
            return _baseResponse.setData(_business.insertAsync(models));
        }

        [HttpPut]
        public ActionResult<BaseResponse> edit([FromBody] ${ValidateService.capitalizeFirstLetter(modelName)} model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new BaseResponse().setError(
                    BaseResponseCode.BAD_REQUEST,
                    string.Join("; ", ModelState.Values
                        .SelectMany(x => x.Errors)
                        .Select(x => x.ErrorMessage))
                ));
            }

            return _baseResponse.setData(_business.updateAsync(model));
        }

        [HttpPut("all")]
        public ActionResult<BaseResponse> edit([FromBody] List<${ValidateService.capitalizeFirstLetter(modelName)}> models)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new BaseResponse().setError(
                    BaseResponseCode.BAD_REQUEST,
                    string.Join("; ", ModelState.Values
                        .SelectMany(x => x.Errors)
                        .Select(x => x.ErrorMessage))
                ));
            }

            return _baseResponse.setData(_business.updateAsync(models));
        }

        [HttpDelete("{id}")]
        public ActionResult<BaseResponse> delete(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new BaseResponse().setError(
                    BaseResponseCode.BAD_REQUEST,
                    BaseResponseMessage.INVALID_ID
                ));
            }

            return _baseResponse.setData(_business.deleteAsync(new ${ValidateService.capitalizeFirstLetter(modelName)}() { id = id }));
        }

        [HttpPost("delete/all")]
        public ActionResult<BaseResponse> delete([FromBody] List<${ValidateService.capitalizeFirstLetter(modelName)}> models)
        {
            try
            {
                return _baseResponse.setData(_business.deleteAsync(models));
            }
            catch (Exception e)
            {
                return _baseResponse.setError(BaseResponseCode.INTERNAL_SERVER_ERROR, e.Message);
            }

        }
        #endregion

    }
}`;
};


