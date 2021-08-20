import { Logger, LoggerError } from '@revolutionmortgage/rm-logger';
import { EventBridgeHandler, EventBridgeEvent } from 'aws-lambda';
import get from 'lodash/get';
import { createLoanDocument, getLoan, getLoanDocuments } from '../clients/encompass';
import { getItem, putItem } from '../common/database';
import { AUDIT_FIELDS, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE } from '../common/constants';
import { getEncompassLoanBorrowerBySocialSecurityNumber } from '../helpers/getEncompassLoanBorrowerBySocialSecurityNumber';
import { getLoanDocumentByTitle } from '../helpers/getLoanDocumentByTitle';
import { getUDNReport } from '../helpers/getUDNReport';
import { uploadUDNReportToEFolder } from '../helpers/uploadUDNReportToEFolder';
import { loanAuditFieldsHaveChanged as haveLoanAuditFieldsChanged } from '../helpers/haveLoanAuditFieldsChanged';
import { InvalidEventParamsError } from '../common/errors';
export class LoanDocumentForUDNReportsNotFoundError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data)
    }
}

interface Detail {
    loan: {
        id: string;
    }
    fields: {
        "CX.CTC.AUDIT1": string;
        "CX.CTC.AUDIT2": string;
        "CX.CTC.AUDIT3": string;
        "CX.CTC.AUDIT4": string;
        "CX.CTC.AUDIT5": string;
        "CX.CTC.AUDIT6": string;
        "CX.CTC.AUDIT7": string;
        "CX.CTC.AUDIT8": string;
        "CX.CTC.AUDIT9": string;
        "CX.CTC.AUDIT10": string;
    }
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
    const loanId = get(event, 'detail.loan.id');
    if (!loanId) {
        throw new InvalidEventParamsError("detail.loan.id", event);
    }

    const fields = get(event, 'detail.fields');
    if (!fields) {
        throw new InvalidEventParamsError("detail.fields", event);
    }

    const lastCompletedMilestone = get(event, 'detail.fields["Log.MS.LastCompleted"]');
    const isResubmittal = lastCompletedMilestone === 'Resubmittal';

    // Get the loan from the database
    const result = await getItem({
        PK: `LOAN#${loanId}`,
        SK: `LOAN#${loanId}`
    });

    // If we can't find it, throw an error.
    if (!result || !result.Item) {
        const logger = new Logger();
        logger.info(`Item LOAN#${loanId} not found in database`)
        return;
    }

    // Have the audit fields changed? If not, return early.
    const auditFieldsHaveChanged = haveLoanAuditFieldsChanged(result.Item, fields);
    if (!auditFieldsHaveChanged && !isResubmittal) {
        return;
    }

    // If they have changed, we need to upload the UDN report.
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

    // Update all of the audit fields with the latest data from the event detail
    const auditFields = {};
    AUDIT_FIELDS.forEach((field: string) => {
        auditFields[field] = fields[field];
    })
    await putItem({
        PK: `LOAN#${loanId}`,
        SK: `LOAN#${loanId}`,
        BorrowerFirstName,
        BorrowerLastName,
        BorrowerSSN,
        CoborrowerFirstName,
        CoborrowerLastName,
        CoborrowerSSN,
        VendorOrderIdentifier,
        ...fields,
    })
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
