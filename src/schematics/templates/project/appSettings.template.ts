import { ConnectionString } from "../../../models/connection-string";

export const appSettingsTemplate = (projectName: string, connectionString: ConnectionString): string => {
return `{
    "Logging": {
        "LogLevel": {
        "Default": "Warning"
        }
    },
    "AllowedHosts": "*",
    "JWTToken": {
        "SigninKey": "f9a32479-4549-4cf3-ba37-daa0078fa6e7",
        "Audience": "${projectName}",
        "Issuer": "${projectName}-issuer",
        "SecondsToExpire": "1800"
    },
    "Email": {
        "Email": "",
        "Password": "",
        "TemplatePath": "",
        "ClientServerUrl": "http://localhost:4200"
    },
    "ConnectionStrings": {
        "DefaultConnection": "server=${connectionString.server};port=${connectionString.port};database=${connectionString.database};user=${connectionString.user};password=${connectionString.password}"
    }
}`;
};