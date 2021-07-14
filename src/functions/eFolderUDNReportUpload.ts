import { LoggerError } from '@revolutionmortgage/rm-logger';
import { EventBridgeHandler, EventBridgeEvent } from 'aws-lambda';
import get from 'lodash/get';
import { createLoanDocument, getLoan, getLoanDocuments } from '../clients/encompass';
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
 * This lambda will upload a UDN report to an eFolder in Encompass
 * @param {Event} event - The event that triggers this lambda
 * @returns {Promise<void>}
 */
export const handler: Handler = async (event: Event): Promise<void> => {
    try {
        const loanId = get(event, 'detail.requestPayload.detail.LoanId');
        if (!loanId) {
            throw new InvalidParamsError("LoanId missing on request payload", event);
        }

        const socialSecurityNumber = get(event, 'detail.requestPayload.detail.SocialSecurityNumber');
        if (!socialSecurityNumber) {
            throw new InvalidParamsError("SocialSecurityNumber missing on request payload");
        }

        const pdf = get(event, 'detail.responsePayload.detail.pdf');
        if (!pdf) {
            throw new InvalidParamsError("pdf missing on response payload", event);
        }

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
    catch (error) {
        console.error(error)
        throw error;
    }
};
