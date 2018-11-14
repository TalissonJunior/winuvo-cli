import { Color } from "../enums";

export class Log {

    constructor() { }

    static success(message: string) {
        if (message)
            console.log(Color.Cyan, message);
    }

    static error(message: string) {
        if (message)
            console.log(Color.RedNoReset, "Error:", Color.WhiteNoReset, message);
            
        process.exit();
    }

    static info(message: string) {
        if (message)
            console.log(Color.White, message);
    }

    static yellow(message: string) {
        if (message)
            console.log(Color.Yellow, message);
    }

    static space() {
        console.log("\n");
    }

    /**
     * @description This method changes the color of text and replace them with 
     * special tags.
     * 
     * @example <update/> my text => UPDATED my text.
     * @example <create/> my teste => CREATED my text.
     * 
     * @description Setting colors.
     * @example "<white> your text </white>"  => "your text" in white color.
     * @example "<info> your text </info>"  => "your text" in white cyan color.
     */
    static log(message: string) {
        if(message == 'skip'){
            return;
        }
        
        if (message) {

            while (message.indexOf('<update/>') > -1) {
                message = message.replace('<update/>', Color.YellowNoReset + 'UPDATED ' + Color.Reset);
            }

            while (message.indexOf('<create/>') > -1) {
                message = message.replace('<create/>', Color.GreenNoReset + 'CREATED ' + Color.Reset);
            }

            while (message.indexOf('<info>') > -1 || message.indexOf('</info>') > -1) {

                message = message.replace('<info>', Color.CyanNoReset);
                message = message.replace('</info>', Color.WhiteNoReset);
            }

            while (message.indexOf('<white>') > -1 || message.indexOf('</white>') > -1) {
                message = message.replace('<white>', Color.WhiteNoReset);
                message = message.replace('</white>', Color.WhiteNoReset);
            }


            console.log(message, Color.Reset);
        }
    }

    static highlightError(message: string) {
        if (message) {

            while (message.indexOf('@!') > -1 || message.indexOf('!@') > -1) {

                message = message.replace('@!', Color.RedNoReset);
                message = message.replace('!@', Color.WhiteNoReset);
            }

            console.log(Color.RedNoReset, "Error:", Color.WhiteNoReset, message, Color.Reset);
        }
    }

}