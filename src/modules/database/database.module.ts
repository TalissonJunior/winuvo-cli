import * as mysql from 'mysql';
import { ConnectionString } from "../../models/connnection-string";
import { BaseResponse } from "../../utilities";
import { BaseResponseCode } from "../../enums";

export class DatabaseModule {
    connectionString: ConnectionString;
    response: BaseResponse;

    constructor() {
        this.response = new BaseResponse();
        this.connectionString = new ConnectionString();
    }


    /**
     * @description Validate the connection string, check if contains all the properties, if so parse it
     * @param connection connection string
     */
    public validateConnectionString(connection: string, callback: BaseCallback): void {
        var connectionString = new ConnectionString();

        for (let property in connectionString) {

            if (connection.toLowerCase().indexOf(property) < 0) {
                callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT_INVALID_CONNECTION_STRING, `Your are missing the property "${property}" on "connectionString" parameter.`));
                return;
            }

            if (property == Object.keys(connectionString)[Object.keys(connectionString).length - 1]) {
                this._parseConnectionString(connection, callback);
                return;
            }
        }
    }

    /**
     * Parse a connection string to the private local variable called "this.connectionString"
     * @param connection 
     * @param callback 
     */
    private _parseConnectionString(connection: string, callback: BaseCallback): void {
        var connectionPropertyArray = connection.split(';');

        // Remove the last empty string on the array;
        if (connectionPropertyArray.length > 0 && !connectionPropertyArray[connectionPropertyArray.length - 1]) {
            connectionPropertyArray.splice(connectionPropertyArray.length - 1, 1);
        }

        if (Object.keys(new ConnectionString()).length == connectionPropertyArray.length) {

            connectionPropertyArray.forEach((property, position) => {
                var arrayPropertyAndValue = property.split(':');

                if (arrayPropertyAndValue.length != 2) {
                    callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT_INVALID_CONNECTION_STRING, 'Connection string "property:value" should be separated by ":" ex: localhost:mylocalhost;port:3306;'));
                    return;
                }
                else {
                    this.connectionString[arrayPropertyAndValue[0]] = arrayPropertyAndValue[1];
                }

                if (connectionPropertyArray.length - 1 == position) {
                    this._testConnection(callback);
                }
            });
        }
        else {
            callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT_INVALID_CONNECTION_STRING, 'Connection string properties should be separated by ";" ex: localhost:mylocalhost;port:3306;'));
        }
    }

    /**
     * @description This method will teste the connection string saved on "this.connectionString", in order to validate and test
     * you should use validateConnectionString method
     * @param callback 
     */
    private _testConnection(callback: BaseCallback): void {

        var conn = mysql.createConnection({
            host: this.connectionString.server,
            port: this.connectionString.port,
            database: this.connectionString.database,
            user: this.connectionString.user,
            password: this.connectionString.password
        });

        conn.connect((err) => {
            if (err) {
                callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT_INVALID_CONNECTION_STRING, err.message));
            }
            else {
                callback(this.response.setData(true));
            }
        });
    }
}