// @ts-nocheck

import { handler } from "../../../src/functions/eFolderUDNReportUpload"
import { createLoan, deleteLoan } from "../encompassTestClient";

const testTimeout = 30000; // 30 seconds. Matches the timeout configurated for this lambda

describe('eFolderUDNReportUpload', () => {
    const testSNN = "799684724";
    let loanId: string;

    beforeEach(async () => {
        const createLoanResponse = await createLoan({
            TaxIdentificationNumber: testSNN,
        });
        const { id } = createLoanResponse.data;
        loanId = id;
    })

    afterEach(async () => {
        await deleteLoan(loanId);
    })

    test('it does not blow up', async () => {
        // Don't worry, this is a fake/test loan in Encompass.
        const event = {
            detail: {
                "requestPayload": {
                    "detail": {
                        "LoanId": loanId,
                    }
                },
                "responsePayload": {
                    "firstName": "Christopher",
                    "lastName": "Gzpygzkx",
                    "socialSecurityNumber": "799684724",
                    "vendorOrderIdentifier": "884",
                    "notificationsCount": 1,
                }
            }
        }

        await expect(handler(event, {}, () => { })).resolves.not.toThrow();
    }, testTimeout)
})