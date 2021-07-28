import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { getItem } from "../../src/common/database";
import wait from "./wait";

const testTimeout = 120000; // 2 minutes.

describe('saveEncompassLoan', () => {
    test('it saves a loan to the database', async () => {
        const event = {
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: "loanId"
                        }
                    }
                },
                responsePayload: {
                    detail: {
                        borrowerFirstName: 'Bobby',
                        borrowerLastName: 'Hill',
                        borrowerSsn: "123",
                        vendorOrderIdentifier: "098"}
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
            PK: `LOAN#${event.detail.requestPayload.detail.loan.id}`,
            SK: `LOAN#${event.detail.requestPayload.detail.loan.id}`
        })

        expect(result.Item).toBeTruthy();
        expect(result.Item?.Id).toEqual(event.detail.requestPayload.detail.loan.id);
        expect(result.Item?.VendorOrderId).toEqual(event.detail.responsePayload.detail.vendorOrderIdentifier);
        expect(result.Item?.BorrowerFirstName).toEqual(event.detail.responsePayload.detail.borrowerFirstName);
        expect(result.Item?.BorrowerLastName).toEqual(event.detail.responsePayload.detail.borrowerLastName);
        expect(result.Item?.BorrowerSSN).toEqual(event.detail.responsePayload.detail.borrowerSsn);
    }, testTimeout);

    test('it saves a loan with a coborrower to the database', async () => {
        const event = {
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: "loanId"
                        }
                    }
                },
                responsePayload: {
                    detail: {
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
            PK: `LOAN#${event.detail.requestPayload.detail.loan.id}`,
            SK: `LOAN#${event.detail.requestPayload.detail.loan.id}`
        })

        expect(result.Item).toBeTruthy();
        expect(result.Item?.Id).toEqual(event.detail.requestPayload.detail.loan.id);
        expect(result.Item?.VendorOrderId).toEqual(event.detail.responsePayload.detail.vendorOrderIdentifier);
        expect(result.Item?.BorrowerFirstName).toEqual(event.detail.responsePayload.detail.borrowerFirstName);
        expect(result.Item?.BorrowerLastName).toEqual(event.detail.responsePayload.detail.borrowerLastName);
        expect(result.Item?.BorrowerSSN).toEqual(event.detail.responsePayload.detail.borrowerSsn);
        expect(result.Item?.CoborrowerFirstName).toEqual(event.detail.responsePayload.detail.coBorrowerFirstName);
        expect(result.Item?.CoborrowerLastName).toEqual(event.detail.responsePayload.detail.coBorrowerLastName);
        expect(result.Item?.CoborrowerSSN).toEqual(event.detail.responsePayload.detail.coBorrowerSsn);
    }, testTimeout)
})