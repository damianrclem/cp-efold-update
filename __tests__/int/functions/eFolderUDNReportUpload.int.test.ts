// @ts-nocheck

import { deleteItem, putItem } from "../../../src/common/database";
import { handler } from "../../../src/functions/eFolderUDNReportUpload"
import { createLoan, deleteLoan } from "../../../src/clients/encompass";
import { AUDIT_FIELDS } from "../../../src/common/constants";

const testTimeout = 30000; // 30 seconds. Matches the timeout configurated for this lambda

describe('eFolderUDNReportUpload', () => {
    test('it does not blow up if the audit fields match', async () => {
        const testLoanId = 'joemama';
        const testItem = {
            PK: `LOAN#${testLoanId}`,
            SK: `LOAN#${testLoanId}`,
        };
        const event = {
            detail: {
                loan: {
                    id: testLoanId,
                    fields: {}
                }
            }
        }

        AUDIT_FIELDS.forEach(field => {
            const value = new Date().toString();
            testItem[field] = value
            event.detail.loan.fields[field] = value
        })

        await putItem(testItem)

        await expect(handler(event, {}, () => { })).resolves.not.toThrow();

        await deleteItem({
            PK: `LOAN#${testLoanId}`,
            SK: `LOAN#${testLoanId}`,
        })
    }, testTimeout);

    test('it does not blow up when uploading UDN report for a borrower', async () => {
        const SSN = "799684724";
        const VendorOrderId = "884";
        const borrowerFirstName = "Integration Test";
        const borrowerLastName = "Integration Test";
        const createLoanResponse = await createLoan({
            loanFolder: "Testing",
            applications: [
                {
                    borrower: {
                        FirstName: borrowerFirstName,
                        LastName: borrowerLastName,
                        TaxIdentificationIdentifier: SSN
                    }
                }
            ]
        });

        const { id } = createLoanResponse.data;
        const testItem = {
            PK: `LOAN#${id}`,
            SK: `LOAN#${id}`,
            BorrowerFirstName: borrowerFirstName,
            BorrowerLastName: borrowerLastName,
            BorrowerSSN: SSN,
            VendorOrderIdentifier: VendorOrderId,
        };

        const event = {
            detail: {
                loan: {
                    id,
                    fields: {}
                }
            }
        };

        AUDIT_FIELDS.forEach(field => {
            testItem[field] = "old"
            event.detail.loan.fields[field] = "new"
        })

        await putItem(testItem);

        await expect(handler(event, {}, () => { })).resolves.not.toThrow();

        await deleteItem({
            PK: `LOAN#${testLoanId}`,
            SK: `LOAN#${testLoanId}`,
        })
    }, testTimeout)
})