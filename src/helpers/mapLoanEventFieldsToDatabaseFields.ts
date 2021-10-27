import get from "lodash/get"
import { Event } from "../functions/saveEncompassLoan"

interface LoanItem {
    Id: string;
}

/**
 * 
 * @param event - The event payload
 * @returns {LoanItem} The loan to save to the database
 */
export const mapLoanEventFieldsToDatabaseFields = (event: Event): LoanItem => {
    return {
        Id: get(event, 'detail.requestPayload.detail.loan.id')
    }
}