import { ValidateService } from "../../../../services";

export const ijwtAuthRepositoryTemplate = (projectName: string, modelName: string): string => {
    return `using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using ${projectName}.Models.Database;
    
    namespace ${projectName}.Repository.Interfaces
    {
        public interface IJWTokenAuthRepository : IBaseRepository<${ValidateService.capitalizeFirstLetter(modelName)}>
        {
            ${ValidateService.capitalizeFirstLetter(modelName)} GetByLogin(string login);
            bool DeleteByID(long id);
            ${ValidateService.capitalizeFirstLetter(modelName)} GetByLoginAndPassword(${ValidateService.capitalizeFirstLetter(modelName)} model);
        }
    }`;
};
    
    
    