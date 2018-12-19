import { BaseCommand } from "../base.command";
import { JWTokenModule } from "../../modules";

export class LibraryCommand extends BaseCommand {
    jwt: JWTokenModule;

    constructor() {
        super();
        this.jwt = new JWTokenModule(this.spinner);
    }

    addJWTokenAuth(tableName: string, callback: BaseCallback, permissionToUpdateTableProperties = false): void {
        this.jwt.add(tableName, callback,permissionToUpdateTableProperties);
    }

}