import { EventBridgeEvent, EventBridgeHandler } from "aws-lambda";
import get from "lodash/get";
import { InvalidEventParamsError } from "../common/errors";

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

const validateLoanData = (event: Event, pathsToRequiredParams: Array<string>) => {
    pathsToRequiredParams.forEach((path: string) => {
        const value = get(event, path);
        if (!value) {
            throw new InvalidEventParamsError(path);
        }
    });
}

export const handler: Handler = async (event: Event) => {
    validateLoanData(event, [
        "detail.loan.id",
        "detail.loan.fields['4000']",
        "detail.loan.fields['4002']",
        "detail.loan.fields['65']",
        "detail.loan.fields['4004']",
        "detail.loan.fields['4006']",
        "detail.loan.fields['97']"
    ])
}