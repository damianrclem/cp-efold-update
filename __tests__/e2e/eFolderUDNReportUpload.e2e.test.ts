import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { deleteItem, putItem } from "../../src/common/database";
import { createLoan, deleteLoan, getLoanDocuments } from "../../src/clients/encompass";
import { AUDIT_FIELDS, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE } from "../../src/common/constants";
import { getLoanDocumentByTitle } from "../../src/helpers/getLoanDocumentByTitle";

const testTimeout = 30000; // 30 seconds. Matches the timeout configurated for this lambda\

describe('eFolderUDNReportUpload', () => {
    test('upload a PDF UDN Report to Encompass eFolder', async () => {
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
        await eventBridgeClient.send(new PutEventsCommand({
            Entries: [
                {
                    Detail: JSON.stringify(event.detail),
                    DetailType: "customfield-changed",
                    EventBusName: `${process.env.ENV}-encompass`,
                    Source: 'com.revolutionmortgage.encompass.ee-loan-hooks'
                },
            ]
        }))

        // wait ten seconds and we will see if everything worked
        setTimeout(async () => {
            const getLoanDocumentsReponse = await getLoanDocuments(id);
            const loanDocument = getLoanDocumentByTitle(getLoanDocumentsReponse.data, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE);
            expect(loanDocument).toBeTruthy();

            await deleteLoan(id);
            await deleteItem({
                PK: `LOAN#${id}`,
                SK: `LOAN#${id}`,
            })
        }, 10000)
    }, testTimeout)
})