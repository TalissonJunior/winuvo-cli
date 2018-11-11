export const iBaseBusinessTemplate = (projectName: string): string => {
return `using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ${projectName}.Business.Utilities;
using ${projectName}.Models;

namespace ${projectName}.Business.Interfaces
{
    public interface IBaseBusin ess<TModel>
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
}`;
};