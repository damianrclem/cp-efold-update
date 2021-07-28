import { LoggerError } from "@revolutionmortgage/rm-logger";

export class InvalidEventParamsError extends LoggerError {
    constructor(param: string, data?: any) {
        super(`Required parameter ${param} is missing on event payload`, data);
    }
}
