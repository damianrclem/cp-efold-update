import { AUDIT_FIELDS } from "../common/constants"

export const loanAuditFieldsHaveChanged = (
    databaseLoanItem: {
        [key: string]: any
    },
    eventLoanFields: {
        [key: string]: any
    }
): boolean => AUDIT_FIELDS.some((field) => {
    return eventLoanFields[field] && databaseLoanItem[field] !== eventLoanFields[field]
})