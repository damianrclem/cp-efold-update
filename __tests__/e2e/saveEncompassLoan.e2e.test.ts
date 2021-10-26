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
            }
        }

        const eventBridgeClient = new EventBridgeClient({
            region: 'us-east-2',
        });

        const entry = {
            Detail: JSON.stringify(event.detail),
            DetailType: "Lambda Function Invocation Result - Success",
            EventBusName: `${process.env.ENV}-credit-plus`,
            Source: 'lambda',
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
            }
        }

        const eventBridgeClient = new EventBridgeClient({
            region: 'us-east-2',
        });

        const entry = {
            Detail: JSON.stringify(event.detail),
            DetailType: "Lambda Function Invocation Result - Success",
            EventBusName: `${process.env.ENV}-credit-plus`,
            Source: 'lambda',
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

        await deleteItem({
            PK: `LOAN#${loanId}`,
            SK: `LOAN#${loanId}`,
        })
    }, testTimeout)
})