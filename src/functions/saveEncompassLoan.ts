import { EventBridgeEvent, EventBridgeHandler } from "aws-lambda";

interface Detail {
    eventType: string
    loan: {
        id: string;
        fields: {
            '4000': string; // borrower first name
            '4002': string; // borrower last name
            '65': string; // borrower tax id
            '4004': string; // coborrower first name
            '4006': string; // coborrower last name
            '97': string; // coborrower tax id
        }
    }
}

type EVENT_TYPE = 'Loan';
type Handler = EventBridgeHandler<EVENT_TYPE, Detail, void>;
type Event = EventBridgeEvent<EVENT_TYPE, Detail>;

export const handler: Handler = (event: Event) => {
    throw new Error('Not implemented')
}