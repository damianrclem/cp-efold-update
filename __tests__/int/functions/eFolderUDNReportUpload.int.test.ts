// @ts-nocheck

import { deleteItem, putItem } from "../../../src/common/database";
import { handler } from "../../../src/functions/eFolderUDNReportUpload"
import { createLoan, deleteLoan } from "../../../src/clients/encompass";

const testTimeout = 30000; // 30 seconds. Matches the timeout configurated for this lambda

describe('eFolderUDNReportUpload', () => {
    test('it does not blow up', async () => {
        const SSN = "799684724";
        const createLoanResponse = await createLoan({
            loanFolder: "Testing",
            applications: [
                {
                    borrower: {
                        FirstName: new Date().toUTCString(),
                        LastName: "Integration Test",
                        TaxIdentificationNumber: SSN
                    }
                }
            ]
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

    test('it does not blow up when notification count matches', async () => {
        const orderID = "I can be whatever I want";
        const SSN = "So can I";
        const notificationsCount = 12;
        await putItem({
            PK: `ORDER#${orderID}`,
            SK: `SSN#${SSN}`,
            NotificationsCount: notificationsCount
        })

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
                    "vendorOrderIdentifier": orderID,
                    "notificationsCount": notificationsCount,
                }
            }
        }

        await expect(handler(event, {}, () => { })).resolves.not.toThrow();

        await deleteItem({
            PK: `ORDER#${orderID}`,
            SK: `SSN#${SSN}`,
        })
    }, testTimeout)
})