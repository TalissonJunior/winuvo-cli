export const baseBusinessTemplate = (projectName: string): string => {
return `using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using ${projectName}.Repository.Interfaces;
using ${projectName}.Business.Utilities;

namespace ${projectName}.Business.Rules
{
    public abstract class BaseBusiness<TRepositoryInterface, TModel> where TRepositoryInterface : IBaseRepository<TModel>
    {
        protected TRepositoryInterface _repository;
        private BaseResponse _baseResponse;

        public BaseBusiness(TRepositoryInterface repository)
        {
            this._repository = repository;
            this._baseResponse = new BaseResponse();
        }

        public BaseResponse get(int id)
        {
            return _baseResponse.setData(_repository.get(id));
        }

        public BaseResponse getAll()
        {
            return _baseResponse.setData(_repository.getAll());
        }

        public BaseResponse insert(List<TModel> models)
        {
            return _baseResponse.setData(_repository.insert(models));
        }

        public BaseResponse insert(TModel model)
        {
            return  _baseResponse.setData(_repository.insert(model));
        }

        public BaseResponse update(List<TModel> models)
        {
            return _baseResponse.setData(_repository.update(models));
        }

        public BaseResponse update(TModel model)
        {
            return _baseResponse.setData(_repository.update(model));
        }

        public BaseResponse delete(List<TModel> models)
        {
            return _baseResponse.setData(_repository.delete(models));
        }

        public BaseResponse delete(TModel model)
        {
            return _baseResponse.setData(_repository.delete(model));
        }

        public BaseResponse deleteAll()
        {
            return _baseResponse.setData(_repository.deleteAll());
        }

        public async Task<TModel> getAsync(int id)
        {
            return await _repository.getAsync(id);
        }

        public async Task<IEnumerable<TModel>> getAllAsync()
        {
            return await _repository.getAllAsync();
        }
        public async Task<long> insertAsync(List<TModel> models)
        {
            return await _repository.insertAsync(models);
        }

        public async Task<long> insertAsync(TModel model)
        {
            return await _repository.insertAsync(model);
        }

        public async Task<bool> updateAsync(List<TModel> models)
        {
            return await _repository.updateAsync(models);
        }

        public async Task<bool> updateAsync(TModel model)
        {
            return await _repository.updateAsync(model);
        }

        public async Task<bool> deleteAsync(List<TModel> models)
        {
            return await _repository.deleteAsync(models);
        }

        public async Task<bool> deleteAsync(TModel model)
        {
            return await _repository.deleteAsync(model);
        }

        public async Task<bool> deleteAllAsync()
        {
            return await _repository.deleteAllAsync();
        }

    }
}`;
};