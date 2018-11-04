export const dateAttributesTemplate = (projectName: string): string => {
    return `using System;

namespace ${projectName}.Models.Attributes
{
    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property)]
    public class UpdatedAt : Attribute{}

    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property)]
    public class CreatedAt : Attribute{}

    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property)]
    public class PrimaryKey : Attribute{}
}`;
};