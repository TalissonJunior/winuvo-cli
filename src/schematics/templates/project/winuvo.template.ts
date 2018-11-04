export const winuvoTemplate = (projectName: string): string => {
return `{
    "Project": {
        "name": "${projectName}"
    },
    "modelsPath": {
        "interfaces":"",
        "main":"/Models/Database/",
        "suffixExtension":".cs"
    },
    "businessPath":{
        "interfaces":"/Business/Interfaces/",
        "main":"/Business/Rules/",
        "suffixExtension":"Business.cs"
    },
    "repositoryPath":{
        "interfaces":"/Repository/Interfaces/",
        "main":"/Repository/Repositories/",
        "suffixExtension":"Repository.cs"
    },
    "connectionPath": {
        "path": "/appsettings.json",
        "property": "ConnectionStrings.DefaultConnection"
    }
}`;
};