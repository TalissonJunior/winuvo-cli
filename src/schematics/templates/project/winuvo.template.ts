export const winuvoTemplate = (projectName: string): string => {
return `{
    "Project": {
        "name": "${projectName}"
    },
    "controllerPath": {
        "interfaces":"",
        "main":"/Controllers/",
        "suffixExtension":"Controller.cs"
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
    "modelPath": {
        "interfaces":"",
        "main":"/Models/Database/",
        "suffixExtension":".cs"
    },
    "viewModelPath": {
        "interfaces": "",
        "main":"/Models/ViewModels/",
        "suffixExtension":"VM.cs"
    },
    "connectionPath": {
        "path": "/appsettings.json",
        "property": "ConnectionStrings.DefaultConnection"
    }
}`;
};