// @ts-nocheck

import { handler } from "../../../src/functions/eFolderUDNReportUpload"
import { createLoan, deleteLoan } from "../encompassTestClient";

const testTimeout = 30000; // 30 seconds. Matches the timeout configurated for this lambda

describe('eFolderUDNReportUpload', () => {
    test('it does not blow up', async () => {
        const SSN = "799684724";
        const createLoanResponse = await createLoan({
            TaxIdentificationNumber: SSN,
        });
        const { id } = createLoanResponse.data;

        // Don't worry, this is a fake/test loan in Encompass.
        const event = {
            detail: {
                "requestPayload": {
                    "detail": {
                        "LoanId": id,
                    }
                },
                "responsePayload": {
                    "firstName": "Christopher",
                    "lastName": "Gzpygzkx",
                    "socialSecurityNumber": SSN,
                    "vendorOrderIdentifier": "884",
                    "notificationsCount": 1,
                }
            }
        }

        await expect(handler(event, {}, () => { })).resolves.not.toThrow();

        await deleteLoan(id);
    }, testTimeout)
})