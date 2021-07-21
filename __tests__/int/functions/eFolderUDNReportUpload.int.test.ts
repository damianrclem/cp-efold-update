// @ts-nocheck

import { handler } from "../../../src/functions/eFolderUDNReportUpload"

const testTimeout = 30000; // 30 seconds. Matches the timeout configurated for this lambda

describe('eFolderUDNReportUpload', () => {
    test('it does not blow up', async () => {
        // Don't worry, this is a fake/test loan in Encompass.
        const event = {
            detail: {
                "requestPayload": {
                    "detail": {
                        "LoanId": "85f30ba1-74d6-431b-8655-73c22991ad40",
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