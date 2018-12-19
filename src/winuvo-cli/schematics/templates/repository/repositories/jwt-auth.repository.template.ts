import { ValidateService } from "../../../../services";

export const jwtAuthRepositoryTemplate = (projectName: string, modelName: string): string => {
    return `using System;
using System.Collections.Generic;
using System.Data;
using Dapper;
using ${projectName}.Repository.Interfaces;
using ${projectName}.Models.Database;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections;
using System.Linq;

namespace ${projectName}.Repository.Repositories
{
    public class JWTokenAuthRepository : BaseRepository<${ValidateService.capitalizeFirstLetter(modelName)}>, IJWTokenAuthRepository
    {
        public JWTokenAuthRepository(IConfiguration config) : base(config)
        {
        }

        public User GetByLogin(string login)
        {
            using (IDbConnection conn = Connection)
            {
                string sql = @"SELECT * FROM ${ValidateService.capitalizeFirstLetter(modelName)} where login = @login";

                return conn.QueryFirstOrDefault<${ValidateService.capitalizeFirstLetter(modelName)}>(sql, new { login = login });
            }
        }

        public bool DeleteByID(long id)
        {
            using (IDbConnection conn = Connection)
            {
                string sql = @"DELETE FROM ${ValidateService.capitalizeFirstLetter(modelName)} WHERE id = @id";

                return conn.Execute(sql, new { id = id }) > 0 ? true : false;
            }
        }

        public ${ValidateService.capitalizeFirstLetter(modelName)} GetByLoginAndPassword(${ValidateService.capitalizeFirstLetter(modelName)} model)
        {
            using (IDbConnection conn = Connection)
            {
                string sql = @"SELECT * FROM ${ValidateService.capitalizeFirstLetter(modelName)} where 
                                login = @login AND password_hash = @password_hash";

                return conn.QueryFirstOrDefault<${ValidateService.capitalizeFirstLetter(modelName)}>(sql, model);
            }
        }

    }
}`;
};
    
    
    