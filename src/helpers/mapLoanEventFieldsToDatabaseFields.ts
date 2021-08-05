import get from "lodash/get"
import { Event } from "../functions/saveEncompassLoan"

interface LoanItem {
    Id: string;
    BorrowerFirstName: string;
    BorrowerLastName: string;
    BorrowerSSN: string;
    CoborrowerFirstName: string;
    CoborrowerLastName: string;
    CoborrowerSSN: string;
    VendorOrderIdentifier: string
}

/**
 * 
 * @param event - The event payload
 * @returns {LoanItem} The loan to save to the database
 */
export const mapLoanEventFieldsToDatabaseFields = (event: Event): LoanItem => {
    return {
        Id: get(event, 'detail.requestPayload.detail.loan.id'),
        BorrowerFirstName: get(event, 'detail.responsePayload.borrowerFirstName'),
        BorrowerLastName: get(event, 'detail.responsePayload.borrowerLastName'),
        BorrowerSSN: get(event, 'detail.responsePayload.borrowerSsn'),
        CoborrowerFirstName: get(event, 'detail.responsePayload.coBorrowerFirstName'),
        CoborrowerLastName: get(event, 'detail.responsePayload.coBorrowerLastName'),
        CoborrowerSSN: get(event, 'detail.responsePayload.coBorrowerSsn'),
        VendorOrderIdentifier: get(event, 'detail.responsePayload.vendorOrderIdentifier')
    }
}