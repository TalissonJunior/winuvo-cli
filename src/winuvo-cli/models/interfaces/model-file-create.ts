import { ModelFile } from "./model-file";

export interface ModelFileCreate extends ModelFile{
    created: boolean;
    message: string;
}