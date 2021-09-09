import { AUDIT_FIELDS } from "../../../src/common/constants";
import { loanAuditFieldsHaveChanged } from "../../../src/helpers/haveLoanAuditFieldsChanged";

describe('loanAuditFieldsHaveChanged', () => {
    test('if all values are the same, it should return false', () => {
        let databaseLoanItem = {};
        let eventLoanFields = {};

        AUDIT_FIELDS.forEach((field) => {
            const value = "test";
            databaseLoanItem[field] = value;
            eventLoanFields[field] = value;
        });

        const result = loanAuditFieldsHaveChanged(databaseLoanItem, eventLoanFields);
        expect(result).toEqual(false)
    });

    test.each(AUDIT_FIELDS)('if all of the fields do not match, it should return true', (input) => {
        const databaseLoanItem = {
            [input]: 'abc'
        };
        const eventLoanFields = {
            [input]: 'xyz'
        };

        const result = loanAuditFieldsHaveChanged(databaseLoanItem, eventLoanFields);
        expect(result).toEqual(true)
    })

    test('if all of the event loan fields are empty strings, it should return false', () => {
        let databaseLoanItem = {};
        let eventLoanFields = {};

        AUDIT_FIELDS.forEach((field) => {
            databaseLoanItem[field] = null;
            eventLoanFields[field] = "";
        });

        const result = loanAuditFieldsHaveChanged(databaseLoanItem, eventLoanFields);
        expect(result).toEqual(false)
    })
})