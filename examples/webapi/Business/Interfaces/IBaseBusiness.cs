using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using webapi.Business.Utilities;
using webapi.Models;

namespace webapi.Business.Interfaces
{
    public interface IBaseBusiness<TModel>
    {
        BaseResponse get(int id);

        BaseResponse getAll();

        BaseResponse insert(List<TModel> models);
        
        BaseResponse insert(TModel model);

        BaseResponse update(List<TModel> models);

        BaseResponse update(TModel model);

        BaseResponse delete(List<TModel> models);

        BaseResponse delete(TModel model);

        BaseResponse deleteAll();

        Task<TModel> getAsync(int id);

        Task<IEnumerable<TModel>> getAllAsync();

        Task<long> insertAsync(List<TModel> models);

        Task<long> insertAsync(TModel model);

        Task<bool> updateAsync(List<TModel> models);

        Task<bool> updateAsync(TModel model);

        Task<bool> deleteAsync(List<TModel> models);

        Task<bool> deleteAsync(TModel model);
        
        Task<bool> deleteAllAsync();
    }
}