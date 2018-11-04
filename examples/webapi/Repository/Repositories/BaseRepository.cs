using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;
using System.Data;
using Dapper;
using Dapper.Contrib.Extensions;
using webapi.Repository.Interfaces;
using webapi.Models.Database;

namespace webapi.Repository.Repositories
{
    public class BaseRepository<TModel> : IBaseRepository<TModel> where TModel : class
    {
        private readonly IConfiguration _config;

        public BaseRepository(IConfiguration config)
        {
            _config = config;
        }

        public IDbConnection Connection
        {
            get
            {
                var connection = new MySqlConnection(_config.GetConnectionString("DefaultConnection"));
                connection.Open();
                return connection;
            }
        }

        public TModel get(int id)
        {
            using (IDbConnection conn = Connection)
            {
                return conn.Get<TModel>(id);
            }
        }

        public IEnumerable<TModel> getAll()
        {
            using (IDbConnection conn = Connection)
            {
                return conn.GetAll<TModel>();
            }
        }

        public long insert(List<TModel> models)
        {
            models.VerifyDateFields<TModel>(true);
            using (IDbConnection conn = Connection)
            {
                return conn.Insert<List<TModel>>(models);
            }
        }

        public long insert(TModel model)
        {
            model.VerifyDateFields<TModel>(true);
            using (IDbConnection conn = Connection)
            {
                return conn.Insert<TModel>(model);
            }
        }

        public bool update(List<TModel> models)
        {
            models.VerifyDateFields<TModel>(false);
            using (IDbConnection conn = Connection)
            {
                return conn.Update<List<TModel>>(models);
            }
        }

        public bool update(TModel model)
        {
            model.VerifyDateFields<TModel>(false);
            using (IDbConnection conn = Connection)
            {
                return conn.Update<TModel>(model);
            }
        }

        public long updateSkipNull(TModel model)
        {
            model.VerifyDateFields<TModel>(false);
            using (IDbConnection conn = Connection)
            {
                string sql = model.GenerateUpdateSqlSkippingNulls<TModel>();

                return conn.Execute(sql, model);
            }
        }

        public bool delete(List<TModel> models)
        {
            using (IDbConnection conn = Connection)
            {
                return conn.Delete<List<TModel>>(models);
            }
        }

        public bool delete(TModel model)
        {
            using (IDbConnection conn = Connection)
            {
                return conn.Delete<TModel>(model);
            }
        }

        public bool deleteAll()
        {
            using (IDbConnection conn = Connection)
            {
                return conn.DeleteAll<TModel>();
            }
        }

        public async Task<TModel> getAsync(int id)
        {
            using (IDbConnection conn = Connection)
            {
                return await conn.GetAsync<TModel>(id);
            }
        }

        public async Task<IEnumerable<TModel>> getAllAsync()
        {
            using (IDbConnection conn = Connection)
            {
                return await conn.GetAllAsync<TModel>();
            }
        }

        public async Task<long> insertAsync(List<TModel> models)
        {
            models.VerifyDateFields<TModel>(true);
            using (IDbConnection conn = Connection)
            {
                return await conn.InsertAsync<List<TModel>>(models);
            }
        }

        public async Task<long> insertAsync(TModel model)
        {
            model.VerifyDateFields<TModel>(true);
            using (IDbConnection conn = Connection)
            {
                return await conn.InsertAsync<TModel>(model);
            }
        }

        public async Task<bool> updateAsync(List<TModel> models)
        {
            models.VerifyDateFields<TModel>(false);
            using (IDbConnection conn = Connection)
            {
                return await conn.UpdateAsync<List<TModel>>(models);
            }
        }

        public async Task<bool> updateAsync(TModel model)
        {
            model.VerifyDateFields<TModel>(false);
            using (IDbConnection conn = Connection)
            {
                return await conn.UpdateAsync<TModel>(model);
            }
        }

        public async Task<bool> deleteAsync(List<TModel> models)
        {
            using (IDbConnection conn = Connection)
            {
                return await conn.DeleteAsync<List<TModel>>(models);
            }
        }

        public async Task<bool> deleteAsync(TModel model)
        {
            using (IDbConnection conn = Connection)
            {
                return await conn.DeleteAsync<TModel>(model);
            }
        }

        public async Task<bool> deleteAllAsync()
        {
            using (IDbConnection conn = Connection)
            {
                return await conn.DeleteAllAsync<TModel>();
            }
        }
    }
}