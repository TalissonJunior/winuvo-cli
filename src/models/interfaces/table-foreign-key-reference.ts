import { TableTree } from "./table-tree";

export interface TableForeignKeyReference {
    /**
     * Column name of the table that is a foreign key
     */
    foreignKeyColumnName: string;
    /**
     * Column name constraint of the table that is a foreign key
     */
    foreignKeyConstraintName: string;
      /**
     * Column nameof the referenced table 
     */
    foreignKeyReferenceTableColumnName: string;
    
    referencedTable: TableTree;
}