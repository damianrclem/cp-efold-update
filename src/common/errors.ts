import { LoggerError } from "@revolutionmortgage/rm-logger";

export class InvalidParamsError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}
