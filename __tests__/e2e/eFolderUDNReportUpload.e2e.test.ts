import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { deleteItem, putItem } from "../../src/common/database";
import { createLoan, deleteLoan, getLoanDocuments } from "../../src/clients/encompass";
import { AUDIT_FIELDS, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE } from "../../src/common/constants";
import { getLoanDocumentByTitle } from "../../src/helpers/getLoanDocumentByTitle";
import wait from './wait';

const testTimeout = 120000; // 2 minutes.

describe('eFolderUDNReportUpload', () => {
    test('It uploads a PDF UDN Report to Encompass eFolder when CTC audit fields are set', async () => {
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
                eventType: "customfield-changed",
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

        const eventBridgeClient = new EventBridgeClient({
            region: 'us-east-2',
        });

        const entry = {
            Detail: JSON.stringify(event.detail),
            DetailType: "Loan",
            EventBusName: `${process.env.ENV}-credit-plus`,
            Source: 'com.revolutionmortgage.encompass.ee-loan-hooks'
        }

        await eventBridgeClient.send(new PutEventsCommand({
            Entries: [
                entry,
            ]
        }))

        let loanDocuments = [];
        let attempts = 1;
        while(loanDocuments.length === 0 && attempts < 3) {
            await wait(10000);
            // wait ten seconds and we will see if everything worked
            const getLoanDocumentsReponse = await getLoanDocuments(id);
            loanDocuments = getLoanDocumentsReponse.data;
            attempts = attempts + 1;
        }

        const loanDocument = getLoanDocumentByTitle(loanDocuments, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE);
        expect(loanDocument).toBeTruthy();
        expect(loanDocument?.attachments.length).toBeGreaterThan(0);

        await deleteLoan(id);
        await deleteItem({
            PK: `LOAN#${id}`,
            SK: `LOAN#${id}`,
        })
    }, testTimeout);

    test('It uploads a PDF UDN Report to Encompass eFolder when Resubmittal milestone is triggered', async () => {
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
                eventType: "milestone-doneindicator-changed",
                loan: {
                    id,
                    fields: {
                        'Log.MS.LastCompleted': 'Resubmittal',
                    }
                }
            }
        };

        await putItem(testItem);

        const eventBridgeClient = new EventBridgeClient({
            region: 'us-east-2',
        });

        const entry = {
            Detail: JSON.stringify(event.detail),
            DetailType: "Loan",
            EventBusName: `${process.env.ENV}-credit-plus`,
            Source: 'com.revolutionmortgage.encompass.ee-loan-hooks'
        }

        await eventBridgeClient.send(new PutEventsCommand({
            Entries: [
                entry,
            ]
        }))

        let loanDocuments = [];
        let attempts = 1;
        while(loanDocuments.length === 0 && attempts < 3) {
            await wait(10000);
            // wait ten seconds and we will see if everything worked
            const getLoanDocumentsReponse = await getLoanDocuments(id);
            loanDocuments = getLoanDocumentsReponse.data;
            attempts = attempts + 1;
        }

        const loanDocument = getLoanDocumentByTitle(loanDocuments, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE);
        expect(loanDocument).toBeTruthy();
        expect(loanDocument?.attachments.length).toBeGreaterThan(0);

        await deleteLoan(id);
        await deleteItem({
            PK: `LOAN#${id}`,
            SK: `LOAN#${id}`,
        })
    }, testTimeout);

})