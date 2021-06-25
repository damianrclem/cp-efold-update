import { LoggerError } from '@revolutionmortgage/rm-logger';
import { EventBridgeHandler, EventBridgeEvent } from 'aws-lambda';
import get from 'lodash/get';
import { createLoanDocument, getLoan, getLoanDocuments } from '../clients/encompass';
import { UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE } from '../constants';
import { getEncompassLoanBorrowerBySocialSecurityNumber } from '../logic/getEncompassLoanBorrowerBySocialSecurityNumber';
import { getLoanDocumentByTitleAndBorrowerName } from '../logic/getLoanDocumentByTitleAndBorrowerName';
import { uploadUDNReportToEFolder } from '../logic/uploadUDNReportToEFolder';

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
 * This lambda will upload a UDN report to an eFolder in Encompass
 * @param {Event} event - The event that triggers this lambda
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

    const pdf = get(event, 'detail.responsePayload.detail.pdf');
    if (!pdf) {
        throw new InvalidParamsError("pdf missing on response payload", event);
    }

    const loanResponse = await getLoan(loanId);
    const borrower = getEncompassLoanBorrowerBySocialSecurityNumber(socialSecurityNumber, loanResponse.data);

    const loanDocumentsResponse = await getLoanDocuments(loanId);
    const existingLoanDocument = getLoanDocumentByTitleAndBorrowerName(loanDocumentsResponse.data, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE, borrower.fullName);
    if (existingLoanDocument) {
        await uploadUDNReportToEFolder(loanId, existingLoanDocument.id, pdf);
    }

    const newLoanDocumentRepsonse = await createLoanDocument(loanId, borrower.applicationId);
    await uploadUDNReportToEFolder(loanId, newLoanDocumentRepsonse.data.id, pdf);
};
