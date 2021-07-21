import { LoggerError } from '@revolutionmortgage/rm-logger';
import { EventBridgeHandler, EventBridgeEvent } from 'aws-lambda';
import get from 'lodash/get';
import { createLoanDocument, getLoan, getLoanDocuments } from '../clients/encompass';
import { getItem, putItem } from '../common/database';
import { UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE } from '../constants';
import { getEncompassLoanBorrowerBySocialSecurityNumber } from '../helpers/getEncompassLoanBorrowerBySocialSecurityNumber';
import { getLoanDocumentByTitle } from '../helpers/getLoanDocumentByTitle';
import { uploadUDNReportToEFolder } from '../helpers/uploadUDNReportToEFolder';

export class InvalidParamsError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}

export class LoanDocumentForUDNReportsNotFoundError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data)
    }
}

interface EventParams {
    vendorOrderIdentifier: string;
    firstName: string;
    lastName: string;
    socialSecurityNumber: string;
    loanId: string;
    notificationsCount: number;
}

/**
 * This will get the required params for the lambda to execute.
 * If not, an InvalidParamsError will be thrown
 * @param {Event} event - The event to verify
 * @returns {EventParams} - the event params required to fulfill the lambda execution
 */
const getEventParams = (event: Event): EventParams => {
    const loanId = get(event, 'detail.requestPayload.detail.LoanId');
    if (!loanId) {
        throw new InvalidParamsError("LoanId missing on request payload", event);
    }

    const vendorOrderIdentifier = get(event, 'detail.responsePayload.vendorOrderIdentifier');
    if (!vendorOrderIdentifier) {
        throw new InvalidParamsError("socialSecurityNumber missing on request payload");
    }

    const firstName = get(event, 'detail.responsePayload.firstName');
    if (!firstName) {
        throw new InvalidParamsError("socialSecurityNumber missing on request payload");
    }

    const lastName = get(event, 'detail.responsePayload.lastName');
    if (!lastName) {
        throw new InvalidParamsError("socialSecurityNumber missing on request payload");
    }

    const socialSecurityNumber = get(event, 'detail.responsePayload.socialSecurityNumber');
    if (!socialSecurityNumber) {
        throw new InvalidParamsError("socialSecurityNumber missing on request payload");
    }

    const notificationsCount = get(event, 'detail.responsePayload.notificationsCount');
    if (!notificationsCount) {
        throw new InvalidParamsError("socialSecurityNumber missing on request payload");
    }

    return {
        loanId,
        firstName,
        lastName,
        socialSecurityNumber,
        vendorOrderIdentifier,
        notificationsCount
    }
} 

interface Detail {
    requestPayload: {
        detail: {
            LoanId: string;
        }
    };
    responsePayload: {
        vendorOrderIdentifier: string;
        firstName: string;
        lastName: string;
        socialSecurityNumber: string;
        notificationsCount: number;
    };
}


type EVENT_TYPE = 'Loan';
type Handler = EventBridgeHandler<EVENT_TYPE, Detail, void>;
type Event = EventBridgeEvent<EVENT_TYPE, Detail>;

/**
 * This lambda will upload a UDN report to an eFolder in Encompass
 * @param {Event} event - The event that triggers this lambda
 * @returns {Promise<void>}
 */
export const handler: Handler = async (event: Event): Promise<void> => {
    const {
        loanId,
        firstName,
        lastName,
        socialSecurityNumber,
        vendorOrderIdentifier,
        notificationsCount
    } = getEventParams(event)

    // Find the UDN order we have saved to compare the notifications count
    const { Item } = await getItem({
        PK: `ORDER#${vendorOrderIdentifier}`,
        SK: `SSN#${socialSecurityNumber}`
    });

    // If we have an order saved in the database, compare it's notifications count
    // with the notifications count from the event payload. If the event payload and the count
    // in the database matches, we don't need to upload.
    if (Item && notificationsCount === Item.NotificationsCount) {
        return;
    }

    const loanResponse = await getLoan(loanId);
    const borrower = getEncompassLoanBorrowerBySocialSecurityNumber(socialSecurityNumber, loanResponse.data);

    const existingLoanDocumentsResponse = await getLoanDocuments(loanId);
    const existingLoanDocument = getLoanDocumentByTitle(existingLoanDocumentsResponse.data, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE);

    // If there is an existing loan document with the correct title, upload to that document
    if (existingLoanDocument) {
        await uploadUDNReportToEFolder(loanId, existingLoanDocument.id, "");
        return;
    }

    // If we could not find the document, create the loan document
    await createLoanDocument(loanId, borrower.applicationId);
    const newLoanDocumentsRepsonse = await getLoanDocuments(loanId);
    const newLoanDocument = getLoanDocumentByTitle(newLoanDocumentsRepsonse.data, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE);

    // If we still can't find it, something has gone wrong
    if (!newLoanDocument) {
        throw new LoanDocumentForUDNReportsNotFoundError(`No documents for loan ${loanId} was found for UDN reports`, newLoanDocumentsRepsonse)
    }

    await uploadUDNReportToEFolder(loanId, newLoanDocument.id, "");

    // Now that we have finished uploading, save the updated notifications count to the database.
    await putItem({
        PK: `ORDER#${vendorOrderIdentifier}`,
        SK: `SSN#${socialSecurityNumber}`,
        OrderId: vendorOrderIdentifier,
        SocialSecurityNumber: socialSecurityNumber,
        NotificationsCount: notificationsCount
    })
};
