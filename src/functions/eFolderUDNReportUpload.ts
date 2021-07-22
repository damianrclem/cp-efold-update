import { LoggerError } from '@revolutionmortgage/rm-logger';
import { EventBridgeHandler, EventBridgeEvent } from 'aws-lambda';
import get from 'lodash/get';
import { createLoanDocument, getLoan, getLoanDocuments } from '../clients/encompass';
import { getItem, putItem } from '../common/database';
import { UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE } from '../common/constants';
import { getEncompassLoanBorrowerBySocialSecurityNumber } from '../helpers/getEncompassLoanBorrowerBySocialSecurityNumber';
import { getLoanDocumentByTitle } from '../helpers/getLoanDocumentByTitle';
import { getUDNReport } from '../helpers/getUDNReport';
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

export class LoanNotFoundError extends LoggerError {
    constructor(loanId: string) {
        super(`Loan with id: ${loanId} not found`)
    }
}

interface EventParams {
    loanId: string;
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
        throw new InvalidParamsError("loanId missing on request payload", event);
    }

    return {
        loanId,
    }
} 

interface Detail {
    requestPayload: {
        detail: {
            LoanId: string;
        }
    };
    responsePayload: EventParams;
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
    } = getEventParams(event)

    // Get the loan from the database
    const result = await getItem({
        PK: `LOAN#${loanId}`,
        SK: `LOAN#${loanId}`
    });

    // If we can't find it, throw an error.
    if (!result || !result.Item) {
        throw new LoanNotFoundError(loanId);
    }

    const {
        BorrowerFirstName,
        BorrowerLastName,
        BorrowerSSN,
        CoborrowerFirstName,
        CoborrowerLastName,
        CoborrowerSSN,
        VendorOrderIdentifier,
    } = result.Item;

    // Create a list of upload requests to make to encompass, starting with the borrower
    const uploadRequests: Array<Promise<void>> = [
        uploadUDNReportForBorrower({
            loanId,
            firstName: BorrowerFirstName,
            lastName: BorrowerLastName,
            socialSecurityNumber: BorrowerSSN,
            vendorOrderIdentifier: VendorOrderIdentifier
        })
    ];

    // If we have a coborrower, add it to the list of requests
    if (CoborrowerFirstName && CoborrowerLastName && CoborrowerSSN) {
        uploadRequests.push(uploadUDNReportForBorrower({
            loanId,
            firstName: CoborrowerFirstName,
            lastName: CoborrowerLastName,
            socialSecurityNumber: CoborrowerSSN,
            vendorOrderIdentifier: VendorOrderIdentifier
        }))
    }
    
    // Fire all requests
    await Promise.all(uploadRequests);
};

const uploadUDNReportForBorrower = async ({
    firstName,
    lastName,
    socialSecurityNumber,
    vendorOrderIdentifier,
    loanId,
}): Promise<void> => {
    // Get the pdf report to upload
    const pdf = await getUDNReport({
        firstName,
        lastName,
        socialSecurityNumber,
        vendorOrderIdentifier
    })

    // Get the loan borrower information
    const loanResponse = await getLoan(loanId);
    const borrower = getEncompassLoanBorrowerBySocialSecurityNumber(socialSecurityNumber, loanResponse.data);

    const existingLoanDocumentsResponse = await getLoanDocuments(loanId);
    const existingLoanDocument = getLoanDocumentByTitle(existingLoanDocumentsResponse.data, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE);

    // If there is an existing loan document with the correct title, upload to that document
    if (existingLoanDocument) {
        await uploadUDNReportToEFolder(loanId, existingLoanDocument.id, pdf);
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

    await uploadUDNReportToEFolder(loanId, newLoanDocument.id, pdf);
}
