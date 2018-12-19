import { TableColumn } from "./table-column";

export interface Table {
    name: string;
    columns: TableColumn[];
}