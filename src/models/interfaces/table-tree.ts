import { TableColumn } from "./table-column";
import { TableForeignKeyReference } from "./table-foreign-key-reference";

export interface TableTree {
    /**
     * The table name
     */
    name: string;
    /**
     * Table columns
     */
    columns: Array<TableColumn>;
    /**
     * foreing keys reference
     */
    references: Array<TableForeignKeyReference>;
    
    middleTables: Array<TableForeignKeyReference>;

    isMiddleTable: boolean;
}