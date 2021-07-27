import { EventBridgeEvent, EventBridgeHandler } from "aws-lambda";
import get from "lodash/get";
import { putItem } from "../common/database";
import { InvalidEventParamsError } from "../common/errors";
import { mapLoanEventFieldsToDatabaseFields } from "../helpers/mapLoanEventFieldsToDatabaseFields";

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
export type Event = EventBridgeEvent<EVENT_TYPE, Detail>;

/**
 * 
 * @param {Event} event - The event from AWS Event bridge
 * @param {Array<string>} pathsToRequiredParams - The paths to all required parameters expected on the event payload
 */
const validateEventPayload = (event: Event, pathsToRequiredParams: Array<string>) => {
    pathsToRequiredParams.forEach((path: string) => {
        const value = get(event, path);
        if (!value) {
            throw new InvalidEventParamsError(path);
        }
    });
}

/**
 * 
 * @param {Event} event - The event from AWS Event bridge
 * @param {string} event.eventType - The event type
 * @param {Object} event.loan - The loan on the event
 * @param {string} event.loan.id - The id of the loan
 * @param {Object} event.loan.fields - Additional fields on the loan
 */
export const handler: Handler = async (event: Event) => {
    validateEventPayload(event, [
        "detail.loan.id",
        "detail.loan.fields['4000']",
        "detail.loan.fields['4002']",
        "detail.loan.fields['65']",
    ])

    const loanItem = mapLoanEventFieldsToDatabaseFields(event.detail.loan);

    await putItem({
        PK: `LOAN#${loanItem.Id}`,
        SK: `LOAN#${loanItem.Id}`,
        ...loanItem
    })
}