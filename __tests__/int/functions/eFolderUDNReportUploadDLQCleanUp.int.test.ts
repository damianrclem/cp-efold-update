// @ts-nocheck
import { GetQueueUrlCommand, PurgeQueueCommand, SendMessageBatchCommand, SendMessageBatchRequestEntry, SQSClient } from "@aws-sdk/client-sqs";
import { v4 as uuid } from 'uuid';
import { handler } from "../../../src/functions/eFolderUDNReportUploadDLQCleanUp";
import { randomNumberFromInterval } from "../../randomNumberFromInterval";

let OLD_ENV;

const createTestMessages = async (numberOfUniqueMessages: number, numberOfDuplicates: number) => {
    const messages: SendMessageBatchRequestEntry[] = [];

    for (let index = 0; index <= numberOfUniqueMessages; index++) {
        const loanId = `${Date.now()}`

        for (let index = 0; index <= numberOfDuplicates; index++) {
            messages.push({
                Id: uuid(),
                MessageBody: JSON.stringify({
                    time: new Date().toString(),
                    detail: {
                        requestPayload: {
                            detail: {
                                loan: {
                                    id: loanId
                                }
                            }
                        }
                    }
                })
            })
        }
    }

    const sqsClient = new SQSClient({
        region: 'us-east-2'
    });

    const { QueueUrl } = await sqsClient.send(new GetQueueUrlCommand({
        QueueName: process.env.QUEUE_NAME
    }));

    for (let index = 0; index < messages.length; index += 10) {
        const messageBatch = messages.slice(index, index + 10);

        await sqsClient.send(new SendMessageBatchCommand({
            QueueUrl,
            Entries: messageBatch
        }))
    }
};

const purgeQueueOfTestMessages = async () => {
    const sqsClient = new SQSClient({
        region: 'us-east-2'
    });

    const { QueueUrl } = await sqsClient.send(new GetQueueUrlCommand({
        QueueName: process.env.QUEUE_NAME
    }));

    await sqsClient.send(new PurgeQueueCommand({
        QueueUrl
    }));
}

describe('eFolderUDNReportUploadDLQCleanUp', () => {
    beforeAll(() => {
        OLD_ENV = { ...process.env }
        process.env = {
            ...OLD_ENV,
            REGION: 'us-east-2',
            QUEUE_NAME: 'cp-efolder-upload-dev-eFolderUDNReportUpload-dlq',
        }
    })

    afterAll(() => {
        process.env = OLD_ENV
    })

    test('works', async () => {
        const numberOfUniqueMessages = randomNumberFromInterval(1, 5);
        const numberOfDuplicates = randomNumberFromInterval(1, 10);

        await createTestMessages(numberOfUniqueMessages, numberOfDuplicates);

        await expect(handler({}, {}, () => {})).resolves.not.toThrow();

        await purgeQueueOfTestMessages();
    });
})