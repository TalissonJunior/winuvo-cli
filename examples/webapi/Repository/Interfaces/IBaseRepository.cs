using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace webapi.Repository.Interfaces
{
    public interface IBaseRepository<TModel>
    {
        TModel get(int id);

        IEnumerable<TModel> getAll();

        long insert(TModel model);

        long insert(List<TModel> models);

        bool update(TModel model);

        bool update(List<TModel> models);

        long updateSkipNull(TModel model);

        bool delete(TModel model);

        bool delete(List<TModel> models);

        bool deleteAll();

        Task<TModel> getAsync(int id);

        Task<IEnumerable<TModel>> getAllAsync();

        Task<long> insertAsync(TModel model);

        Task<long> insertAsync(List<TModel> models);

        Task<bool> updateAsync(TModel model);

        Task<bool> updateAsync(List<TModel> models);

        Task<bool> deleteAsync(TModel model);

        Task<bool> deleteAsync(List<TModel> models);
        
        Task<bool> deleteAllAsync();
    }
}