export const modelHandlerTemplate = (projectName: string): string => {
 return `using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Reflection;
using ${projectName}.Models.Attributes;

namespace ${projectName}.Models.Database
{
    public static class ModelHandler
    {

        /// <summary>
        /// This will return a model based on the typed that is being passed
        /// </summary>
        /// <example>User user = UserPage.ConvertTo<User>()</example>
        public static TConvert ConvertTo<TConvert>(this object entity) where TConvert : new()
        {
            var convertProperties = TypeDescriptor.GetProperties(typeof(TConvert)).Cast<PropertyDescriptor>();
            var entityProperties = TypeDescriptor.GetProperties(entity).Cast<PropertyDescriptor>();

            var convert = new TConvert();

            foreach (var entityProperty in entityProperties)
            {
                var property = entityProperty;
                var convertProperty = convertProperties.FirstOrDefault(prop => prop.Name == property.Name);
                if (convertProperty != null)
                {
                    convertProperty.SetValue(convert, Convert.ChangeType(entityProperty.GetValue(entity), convertProperty.PropertyType));
                }
            }

            return convert;
        }

        /// <summary>
        /// This method will update [createdAt], [updateAt] properties based on 'isInsert' property
        /// </summary>
        /// <example>model.VerifyDateFields<modelType>(true|false)</example>
        public static void VerifyDateFields<TParse>(this object entity, bool isInsert = true)
        {
            if (entity is List<TParse>)
            {
                foreach (var model in entity as List<TParse>)
                {
                    model.handleDateFieldsProperties<TParse>(isInsert);
                }
            }
            else{
                entity.handleDateFieldsProperties<TParse>(isInsert);
            }
        }

        public static string GenerateUpdateSqlSkippingNulls<TParse>(this object entity, bool isInsert = true)
        {
            var type = typeof(TParse);
            var sql = "UPDATE ";
            var sqlWhereStatement = "WHERE ";

            dynamic tableattr = type.GetCustomAttributes(false).SingleOrDefault(attr => attr.GetType().Name == "TableAttribute");

            if (tableattr != null)
            {
                sql += tableattr.Name + " SET";
            }
            else
            {
                throw new Exception($" Coudn´t find the table attribute '[Table(name)]' of {typeof(TParse).Name} ");
            }

            var properties = type.GetProperties();
            foreach (var property in properties)
            {
                if (property.IsDefined(typeof(PrimaryKey), false))
                {
                    sqlWhereStatement += tableattr.Name + "." + property.Name + " = @" + property.Name + " AND ";
                }
                else if (property.GetValue(entity, null) != null && property.GetValue(entity).ToString().Trim() != String.Empty && !property.IsDefined(typeof(CreatedAt), false))
                {
                    sql += " " + tableattr.Name + "." + property.Name + " = @" + property.Name + ",";
                }
            }

            sql = sql.Substring(0, sql.LastIndexOf(","));
            sql += " " + sqlWhereStatement.Substring(0, sqlWhereStatement.LastIndexOf("AND"));

            return sql;
        }


        private static void handleDateFieldsProperties<TParse>(this object entity, bool isInsert = true)
        {
            var type = typeof(TParse);

            var properties = type.GetProperties();
            foreach (var property in properties)
            {
                if (property.IsDefined(typeof(UpdatedAt), false))
                {
                    PropertyInfo field = typeof(TParse).GetProperty(property.Name);
                    field.SetValue(entity, DateTime.Now, null);
                }

                if (property.IsDefined(typeof(CreatedAt), false) && isInsert)
                {
                    PropertyInfo field = typeof(TParse).GetProperty(property.Name);
                    field.SetValue(entity, DateTime.Now, null);
                }

            }
        }
        
    }
}`;
};