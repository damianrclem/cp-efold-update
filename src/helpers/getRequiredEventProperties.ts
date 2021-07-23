import { LoggerError } from "@revolutionmortgage/rm-logger";
import { get } from "lodash";

export class InvalidParamsError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}

interface RequiredEventProperties {
    loanId: string;
}

/**
 * This will get the required params for the lambda to execute.
 * If not, an InvalidParamsError will be thrown
 * @param {Event} event - The event to verify
 * @returns {RequiredEventProperties} - the event params required to fulfill the lambda execution
 */
export const getRequiredEventProperties = (event: Event): RequiredEventProperties => {
    const loanId = get(event, 'detail.requestPayload.detail.LoanId');
    if (!loanId) {
        throw new InvalidParamsError("loanId missing on request payload", event);
    }

    return {
        loanId,
    }
} 