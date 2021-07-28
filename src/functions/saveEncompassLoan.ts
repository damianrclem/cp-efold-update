import { EventBridgeEvent, EventBridgeHandler } from "aws-lambda";
import get from "lodash/get";
import { putItem } from "../common/database";
import { InvalidEventParamsError } from "../common/errors";
import { mapLoanEventFieldsToDatabaseFields } from "../helpers/mapLoanEventFieldsToDatabaseFields";

interface Detail {
    eventType: string
    requestPayload: {
        detail: {
            loan: {
                id: string;
            }
        }
    }
    responsePayload: {
        detail: {
            vendorOrderIdentifier: string;
            borrowerFirstName: string;
            borrowerLastName: string;
            borrowerSsn: string;
            coBorrowerFirstName: string;
            coBorrowerLastName: string;
            coBorrowerSsn: string;
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
        "detail.requestPayload.detail.loan.id",
        "detail.responsePayload.detail.borrowerFirstName",
        "detail.responsePayload.detail.borrowerLastName",
        "detail.responsePayload.detail.borrowerSsn",
        "detail.responsePayload.detail.vendorOrderIdentifier"
    ])

    const loanItem = mapLoanEventFieldsToDatabaseFields(event);

    await putItem({
        PK: `LOAN#${loanItem.Id}`,
        SK: `LOAN#${loanItem.Id}`,
        ...loanItem
    })
}