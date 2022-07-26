// @ts-nocheck

import { deleteItem, putItem } from "../../../src/common/database";
import { InvalidEventParamsError } from "../../../src/common/errors";
import { handler } from "../../../src/functions/eFolderUDNReportUpload"
import { createLoan, deleteLoan } from "../../../src/clients/encompass";
import { AUDIT_FIELDS } from "../../../src/common/constants";

const testTimeout = 30000; // 30 seconds. Matches the timeout configurated for this lambda

describe('eFolderUDNReportUpload', () => {
    test('throws InvalidEventParamsError if event is missing loan id', async () => {
        const invalidHandler = handler({}, {}, () => { });
        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.loan.id is missing on event payload");
    }, testTimeout)

    test('throws InvalidEventParamsError if event is missing loan fields', async () => {
        const invalidHandler = handler({
            detail: {
                loan: {
                    id: "whatever"
                }
            }
        }, {}, () => { });
        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.fields is missing on event payload");
    }, testTimeout)

    test('throws InvalidEventParamsError if event is missing file number', async () => {
        const invalidHandler = handler({
            detail: {
                loan: {
                    id: "whatever"
                },
                fields: {}
            }
        }, {}, () => { });
        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.fields['CX.CP.UDN.FILENUMBER'] is missing on event payload");
    }, testTimeout)

    test('does not upload a udn report if the loan is not found', async () => {
        const response = await handler({
            detail: {
                loan: {
                    id: "whatever",
                },
                fields: {
                    'CX.CP.UDN.FILENUMBER': '123'
                }
            }
        }, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: false,
        })
    }, testTimeout)

    test('it does not upload a udn report if the audit fields match', async () => {
        const testLoanId = 'joemama';
        const testItem = {
            PK: `LOAN#${testLoanId}`,
            SK: `LOAN#${testLoanId}`,
        };
        const event = {
            detail: {
                loan: {
                    id: testLoanId,
                },
                fields: {
                    'CX.CP.UDN.FILENUMBER': '123'
                }
            }
        }

        AUDIT_FIELDS.forEach(field => {
            const value = new Date().toString();
            testItem[field] = value
            event.detail.fields[field] = value
        })

        await putItem(testItem)

        const response = await handler(event, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: false,
        })

        await deleteItem({
            PK: `LOAN#${testLoanId}`,
            SK: `LOAN#${testLoanId}`,
        })
    }, testTimeout);

    test('it does not upload a udn report if the audit fields match', async () => {
        const testLoanId = 'joemama';
        const testItem = {
            PK: `LOAN#${testLoanId}`,
            SK: `LOAN#${testLoanId}`,
            UDNReportNotUploadable: true,
        };
        const event = {
            detail: {
                loan: {
                    id: testLoanId,
                },
                fields: {
                    'CX.CP.UDN.FILENUMBER': '123'
                }
            }
        }

        await putItem(testItem)

        const response = await handler(event, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: false,
        })

        await deleteItem({
            PK: `LOAN#${testLoanId}`,
            SK: `LOAN#${testLoanId}`,
        })
    }, testTimeout);

    test('it successfully uploads when trying to upload a UDN report for a borrower', async () => {
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
        };

        const event = {
            detail: {
                loan: {
                    id,
                    loanNumber: Date.now().toString()
                },
                fields: {
                    '4000': borrowerFirstName,
                    '4002': borrowerLastName,
                    '65': SSN,
                    'CX.CP.UDN.FILENUMBER': VendorOrderId,
                }
            }
        };

        AUDIT_FIELDS.forEach(field => {
            testItem[field] = "old"
            event.detail.fields[field] = "new"
        })

        await putItem(testItem);

        const response = await handler(event, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: true,
        })

        await deleteLoan(id);
        await deleteItem({
            PK: `LOAN#${id}`,
            SK: `LOAN#${id}`,
        })
    }, testTimeout)

    test('it successfully uploads when trying to upload a UDN report for a borrower and coborrower', async () => {
        const SSN = "799684724";
        const VendorOrderId = "884";
        const borrowerFirstName = "Integration Test";
        const borrowerLastName = "Integration Test";
        const coBorrowerFirstName = "Co-Integration test";
        const coBorrowerLastName = "Co-Integration test";
        const createLoanResponse = await createLoan({
            loanFolder: "Testing",
            applications: [
                {
                    borrower: {
                        FirstName: borrowerFirstName,
                        LastName: borrowerLastName,
                        TaxIdentificationIdentifier: SSN
                    },
                    coborrower: {
                        FirstName: coBorrowerFirstName,
                        LastName: coBorrowerLastName,
                        TaxIdentificationIdentifier: SSN
                    }
                }
            ]
        });

        const { id } = createLoanResponse.data;
        const testItem = {
            PK: `LOAN#${id}`,
            SK: `LOAN#${id}`,
        };

        const event = {
            detail: {
                loan: {
                    id,
                    loanNumber: Date.now().toString()
                },
                fields: {
                    'CX.CP.UDN.FILENUMBER': VendorOrderId,
                    '4000': borrowerFirstName,
                    '4002': borrowerLastName,
                    '65': SSN,
                    '4004': coBorrowerFirstName,
                    '4006': coBorrowerLastName,
                    '97': SSN
                }
            }
        };

        AUDIT_FIELDS.forEach(field => {
            testItem[field] = "old"
            event.detail.fields[field] = "new"
        })

        await putItem(testItem);

        const response = await handler(event, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: true,
        })

        await deleteLoan(id);
        await deleteItem({
            PK: `LOAN#${id}`,
            SK: `LOAN#${id}`,
        })
    }, testTimeout)
})