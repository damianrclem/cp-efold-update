import { LoggerError } from '@revolutionmortgage/rm-logger';
import { EventBridgeHandler, EventBridgeEvent } from 'aws-lambda';
import get from 'lodash/get';

export class InvalidParamsError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}

interface Detail {
    requestPayload: {
        detail: {
            LoanId: string;
        }
    };
    responsePayload: {
        pdf: string;
    };
}

type EVENT_TYPE = 'Loan';
type Handler = EventBridgeHandler<EVENT_TYPE, Detail, void>;
type Event = EventBridgeEvent<EVENT_TYPE, Detail>;

/**
 * An example Event Bridge Lambda
 * @param {Event} event
 * @returns {Promise<void>}
 */
export const handler: Handler = async (event: Event): Promise<void> => {
    const loanId = get(event, 'detail.requestPayload.detail.LoanId');
    if (!loanId) {
        throw new InvalidParamsError("LoanId missing on request payload", event);
    }

    const socialSecurityNumber = get(event, 'detail.requestPayload.detail.SocialSecurityNumber');
    if (!socialSecurityNumber) {
        throw new InvalidParamsError("SocialSecurityNumber missing on request payload");
    }

    const pdf = get(event, 'detail.responsePayload.pdf');
    if (!pdf) {
        throw new InvalidParamsError("pdf missing on response payload", event);
    }
};
