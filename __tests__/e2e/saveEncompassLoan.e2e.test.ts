import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { deleteItem, getItem } from "../../src/common/database";
import wait from "./wait";

const testTimeout = 120000; // 2 minutes.

describe('saveEncompassLoan', () => {
    test('it saves a loan to the database', async () => {
        const loanId = new Date().getMinutes();
        const event = {
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: loanId
                        }
                    }
                },
                responsePayload: {
                    borrowerFirstName: 'Bobby',
                    borrowerLastName: 'Hill',
                    borrowerSsn: "123",
                    vendorOrderIdentifier: "098"
                }
            }
        }

        const eventBridgeClient = new EventBridgeClient({
            region: 'us-east-2',
        });

        const entry = {
            Detail: JSON.stringify(event.detail),
            DetailType: "lambda",
            EventBusName: `${process.env.ENV}-credit-plus`,
            Source: 'Lambda Function Invocation Result - Success',
            Resources: [
                `arn:aws:lambda:us-east-2:709027452869:function:cp-create-udn-order-dev-createUdnOrder:$LATEST`
            ]
        }

        await eventBridgeClient.send(new PutEventsCommand({
            Entries: [
                entry,
            ],
        }))

        await wait(10000);

        const result = await getItem({
            PK: `LOAN#${loanId}`,
            SK: `LOAN#${loanId}`,
        })

        expect(result.Item).toBeTruthy();
        expect(result.Item?.Id).toEqual(event.detail.requestPayload.detail.loan.id);
        expect(result.Item?.VendorOrderIdentifier).toEqual(event.detail.responsePayload.vendorOrderIdentifier);
        expect(result.Item?.BorrowerFirstName).toEqual(event.detail.responsePayload.borrowerFirstName);
        expect(result.Item?.BorrowerLastName).toEqual(event.detail.responsePayload.borrowerLastName);
        expect(result.Item?.BorrowerSSN).toEqual(event.detail.responsePayload.borrowerSsn);

        await deleteItem({
            PK: `LOAN#${loanId}`,
            SK: `LOAN#${loanId}`,
        })
    }, testTimeout);

    test('it saves a loan with a coborrower to the database', async () => {
        const loanId = new Date().getMinutes();
        const event = {
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: loanId,
                        }
                    }
                },
                responsePayload: {
                    borrowerFirstName: 'Bobby',
                    borrowerLastName: 'Hill',
                    borrowerSsn: "123",
                    vendorOrderIdentifier: "098",
                    coBorrowerFirstName: 'bert',
                    coBorrowerLastName: 'berty',
                    coBorrowerSsn: 'hello',
                }
            }
        }

        const eventBridgeClient = new EventBridgeClient({
            region: 'us-east-2',
        });

        const entry = {
            Detail: JSON.stringify(event.detail),
            DetailType: "lambda",
            EventBusName: `${process.env.ENV}-credit-plus`,
            Source: 'Lambda Function Invocation Result - Success',
            Resources: [
                `arn:aws:lambda:us-east-2:709027452869:function:cp-create-udn-order-dev-createUdnOrder:$LATEST`
            ]
        }

        await eventBridgeClient.send(new PutEventsCommand({
            Entries: [
                entry,
            ]
        }))

        await wait(10000);

        const result = await getItem({
            PK: `LOAN#${loanId}`,
            SK: `LOAN#${loanId}`,
        })

        expect(result.Item).toBeTruthy();
        expect(result.Item?.Id).toEqual(event.detail.requestPayload.detail.loan.id);
        expect(result.Item?.VendorOrderIdentifier).toEqual(event.detail.responsePayload.vendorOrderIdentifier);
        expect(result.Item?.BorrowerFirstName).toEqual(event.detail.responsePayload.borrowerFirstName);
        expect(result.Item?.BorrowerLastName).toEqual(event.detail.responsePayload.borrowerLastName);
        expect(result.Item?.BorrowerSSN).toEqual(event.detail.responsePayload.borrowerSsn);
        expect(result.Item?.CoborrowerFirstName).toEqual(event.detail.responsePayload.coBorrowerFirstName);
        expect(result.Item?.CoborrowerLastName).toEqual(event.detail.responsePayload.coBorrowerLastName);
        expect(result.Item?.CoborrowerSSN).toEqual(event.detail.responsePayload.coBorrowerSsn);

        await deleteItem({
            PK: `LOAN#${loanId}`,
            SK: `LOAN#${loanId}`,
        })
    }, testTimeout)
})