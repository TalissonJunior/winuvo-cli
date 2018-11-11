import * as fs from 'fs';
import * as path from 'path';
import * as mysql from 'mysql';
import { ConnectionString } from "../../models/connection-string";
import { BaseResponse } from "../../utilities";
import { BaseResponseCode } from "../../enums";
import { Table, TableColumn } from '../../models/interfaces';
import { TableTree } from '../../models/interfaces/table-tree';
import { validCreatedDateFields, validUpdatedDateFields } from '../model/constants/valid-create-update-date-fields';

export class DatabaseModule {
    tables: Array<Table> = [];
    tablesTree: Array<TableTree>;
    connectionString: ConnectionString;
    response: BaseResponse;

    constructor() {
        this.response = new BaseResponse();
        this.connectionString = new ConnectionString();
        this.tablesTree = new Array<TableTree>();
    }

    connect(connection: string | ConnectionString = null, callback: BaseCallback) {
        // Todo - check dialect
        if (!connection) {
            this._getConnectionString((response) => {
                if (response.data) {

                    this.validateConnectionString(response.data, (validaConnectionResponse) => {
                        if (response.data) {
                            this._mysqlGetTablesAndAttributes(this.connectionString, callback);
                        }
                        else {
                            callback(validaConnectionResponse);
                        }
                    }, '=');

                }
                else {
                    callback(response);
                }
            });
        }
        else if (typeof connection == 'string') {
            this.validateConnectionString(connection, (validaConnectionResponse) => {
                if (validaConnectionResponse.data) {
                    this._mysqlGetTablesAndAttributes(this.connectionString, callback);
                }
                else {
                    callback(validaConnectionResponse);
                }
            }, '=');
        }
        else {
            this._mysqlGetTablesAndAttributes(connection, callback);
        }
    }

    /**
     * @description Validate the connection string, check if contains all the properties, if so parse it
     * @param connection connection string
     */
    public validateConnectionString(connection: string, callback: BaseCallback, propertySeparator: string = ':'): void {
        var connectionString = new ConnectionString();

        for (let property in connectionString) {

            if (connection.toLowerCase().indexOf(property) < 0) {
                callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT_INVALID_CONNECTION_STRING, `Your are missing the property "${property}" on "connectionString" parameter.`));
                return;
            }

            if (property == Object.keys(connectionString)[Object.keys(connectionString).length - 1]) {
                this._parseConnectionString(connection, callback, propertySeparator);
                return;
            }
        }
    }

    /**
     * Parse a connection string to the private local variable called "this.connectionString"
     * @param connection 
     * @param callback 
     */
    private _parseConnectionString(connection: string, callback: BaseCallback, propertySeparator: string = ':'): void {
        var connectionPropertyArray = connection.split(';');

        // Remove the last empty string on the array;
        if (connectionPropertyArray.length > 0 && !connectionPropertyArray[connectionPropertyArray.length - 1]) {
            connectionPropertyArray.splice(connectionPropertyArray.length - 1, 1);
        }

        if (Object.keys(new ConnectionString()).length == connectionPropertyArray.length) {

            connectionPropertyArray.forEach((property, position) => {
                var arrayPropertyAndValue = property.split(propertySeparator);

                if (arrayPropertyAndValue.length != 2) {
                    callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT_INVALID_CONNECTION_STRING, `Connection string "property${propertySeparator}value" should be separated by "${propertySeparator}" ex: localhost${propertySeparator}mylocalhost;`));
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
            callback(this.response.setError(BaseResponseCode.FAIL_TO_CREATE_PROJECT_INVALID_CONNECTION_STRING, `Connection string properties should be separated by ";" ex: localhost${propertySeparator}mylocalhost;port${propertySeparator}3306;`));
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

    private _mysqlGetTablesAndAttributes(connection: ConnectionString, callback: BaseCallback) {
        var middlesTables = [];
        var conn = mysql.createConnection({
            host: connection.server,
            port: connection.port,
            database: connection.database,
            user: connection.user,
            password: connection.password
        });

        conn.connect((err: mysql.MysqlError) => {

            if (err) {
                callback(this.response.setError(BaseResponseCode.FAIL_TO_CONNECT_DATABASE, err.message));
                return;
            }

            // List all tables
            conn.query('SHOW TABLES', (err: mysql.MysqlError, tables: Array<any>) => {

                if (err) {
                    callback(this.response.setError(`Insuficient previlegies in database "${connection.database}"`, err.message));
                    return;
                }

                // Get tables names
                tables.forEach((table) => {
                    this.tables.push({ name: table[Object.keys(table)[0]], columns: [] });
                });

                if (tables.length > 0) {
                    var tablesDescribePromises = [];
                    // Get tables attributes
                    this.tables.forEach((table: Table, index: number) => {

                        var promise = new Promise((resolve, reject) => {
                            conn.query('DESCRIBE ' + table.name, (err: mysql.MysqlError, tableColumns: Array<TableColumn>) => {
                                if (err) {
                                    reject(this.response.setError(`Insuficient previlegies in database "${connection.database}" for table ${table.name}`, err.message));
                                }

                                table.columns = tableColumns;

                                resolve(this.response.setData(true));
                            });
                        });

                        tablesDescribePromises.push(promise);

                    });// End of foreach

                    Promise.all(tablesDescribePromises).then(() => {
                        var tableTreePromises = [];

                        // Create tables tree
                        this.tables.forEach((table: Table) => {

                            if (!this._isTheMiddleTable(table)) {
                                var tableTree = {
                                    name: table.name,
                                    columns: table.columns,
                                    references: []
                                } as TableTree;

                                var promise = new Promise((resolve, reject) => {
                                    this._createTableChildTree(conn, tableTree, (createTableTreeResponse) => {

                                        if (createTableTreeResponse.data) {
                                            this.tablesTree.push(createTableTreeResponse.data);
                                            resolve(true);
                                        }
                                        else {
                                            reject(createTableTreeResponse);
                                        }
                                    });
                                });

                                tableTreePromises.push(promise);
                            }
                            else {
                                middlesTables.push(table);
                            }
                        });

                        Promise.all(tableTreePromises).then(() => {

                            this.tablesTree.forEach((table: TableTree) => {

                                var promise = new Promise((resolve, reject) => {
                                    this._associateMidleTables(table, middlesTables, (tableResult) => {

                                        if (tableResult.data) {
                                            table = tableResult.data;
                                            resolve(true);
                                        }
                                        else {
                                            reject(tableResult);
                                        }
                                    });
                                });

                                tableTreePromises.push(promise);
                            });

                            Promise.all(tableTreePromises).then(() => {
                                callback(this.response.setData(true));
                            }, (error: BaseResponse) => {
                                callback(error);
                            });

                        }, (error: BaseResponse) => {
                            callback(error);
                        });

                    }, (error: BaseResponse) => {
                        callback(error);
                    });
                }
                else {
                    callback(this.response.setData(true));
                }

            });
        });
    }

    private _getConnectionString(callback: BaseCallback) {
        var destination = path.join(process.cwd(), 'appsettings.json');

        fs.readFile(destination, 'utf8', (err: NodeJS.ErrnoException, data) => {

            if (err) {
                callback(this.response.setError(`Could not find the "${destination}" file`, `Make sure you have the "${destination}" file`));
            }
            else {
                var appsettings = JSON.parse(data);

                if (!appsettings['ConnectionStrings']) {
                    callback(this.response.setError(`Could not find the property "ConnectionStrings"`, `Make sure you have the property "ConnectionStrings" on your "${destination}" file.`));
                }
                else if (!appsettings['ConnectionStrings']['DefaultConnection']) {
                    callback(this.response.setError(`Could not find the property "ConnectionStrings.DefaultConnection"`, `Make sure you have the property "ConnectionStrings.DefaultConnection" on your "${destination}" file.`));
                }
                else {
                    callback(this.response.setData(appsettings['ConnectionStrings']['DefaultConnection']));
                }
            }
        });
    }

    private _associateMidleTables(table: TableTree, middleTables: Array<TableTree> = [], callback: BaseCallback) {

        table.middleTables = [];

        middleTables.forEach((middleTable) => {
            var referenceFields = middleTable.columns.filter((row) => row.Key == 'PRI').map((row) => row.Field);

            var field = referenceFields.find((field) => {
                var result = table.columns.find((tableRow) => tableRow.Field == field);

                if (result && field == result.Field) {
                    return true;
                }
            });

            if (field) {
                table.middleTables.push(middleTable);
            }
        });


        callback(this.response.setData(table));

    }

    private _createTableChildTree(conn: mysql.Connection, table: TableTree, callback: BaseCallback) {

        conn.query(`
            select COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_COLUMN_NAME, REFERENCED_TABLE_NAME
            from information_schema.KEY_COLUMN_USAGE
            where TABLE_NAME = '${table.name}'
            and REFERENCED_TABLE_SCHEMA = '${this.connectionString.database}'
            `,
            (err: mysql.MysqlError, rows: Array<any>) => {
                if (err) {
                    callback(this.response.setError(`Insuficient previlegies in database "${this.connectionString.database}" for table ${table.name}`, err.message));
                    return;
                }

                if (rows.length > 0) {

                    rows.forEach((row, index) => {
                        table.references.push({
                            foreignKeyColumnName: row['COLUMN_NAME'],
                            foreignKeyConstraintName: row['CONSTRAINT_NAME'],
                            foreignKeyReferenceTableColumnName: row['REFERENCED_COLUMN_NAME'],
                            referencedTable: {
                                name: this.tables.find((tb) => tb.name == row['REFERENCED_TABLE_NAME']).name,
                                columns: this.tables.find((tb) => tb.name == row['REFERENCED_TABLE_NAME']).columns,
                                references: [],
                                middleTables: []
                            }
                        });

                        if (rows.length - 1 == index) {
                            callback(this.response.setData(table));
                        }
                    });
                }
                else {
                    callback(this.response.setData(table));
                }
            });
    }

    private _createTableTree(conn: mysql.Connection, table: TableTree, callback: BaseCallback) {

        conn.query(`
            select COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_COLUMN_NAME, REFERENCED_TABLE_NAME
            from information_schema.KEY_COLUMN_USAGE
            where TABLE_NAME = '${table.name}'
            and REFERENCED_TABLE_SCHEMA = '${this.connectionString.database}'
            `,
            (err: mysql.MysqlError, rows: Array<any>) => {
                if (err) {
                    callback(this.response.setError(`Insuficient previlegies in database "${this.connectionString.database}" for table ${table.name}`, err.message));
                    return;
                }

                if (rows.length > 0) {

                    rows.forEach((row) => {
                        table.references.push({
                            foreignKeyColumnName: row['COLUMN_NAME'],
                            foreignKeyConstraintName: row['CONSTRAINT_NAME'],
                            foreignKeyReferenceTableColumnName: row['REFERENCED_COLUMN_NAME'],
                            referencedTable: {
                                name: this.tables.find((tb) => tb.name == row['REFERENCED_TABLE_NAME']).name,
                                columns: this.tables.find((tb) => tb.name == row['REFERENCED_TABLE_NAME']).columns,
                                references: [],
                                middleTables: []
                            }
                        });

                    });

                    table.references.forEach((tb, index) => {
                        this._createTableTree(conn, tb.referencedTable, (response) => {
                            table.references[index].referencedTable = response.data;

                            if (index == table.references.length - 1) {
                                callback(this.response.setData(table));
                            }
                        });
                    });
                }
                else {
                    callback(this.response.setData(table));
                }
            });
    }

    /**
     * @description It will check if the table is the middle table, the one used 
     * to relate 2 tables, the one that doesn´t have data to retrieve 
     * @param table 
     */
    private _isTheMiddleTable(table: Table) {

        var primaryAndForeignFiedKeys = table.columns.filter((column) => column.Key == 'PRI');

        if ((primaryAndForeignFiedKeys.length == 3 || primaryAndForeignFiedKeys.length == 2)) {
            var createUpdateDateFields = table.columns.filter((column) => validCreatedDateFields[column.Field] || validUpdatedDateFields[column.Field]);

            if (createUpdateDateFields.length == 2 && table.columns.length <= 5) {
                return true;
            }
            else if (!createUpdateDateFields.length && table.columns.length <= 3) {
                return true;
            }

            return false;
        }

        return false;
    }
}                             