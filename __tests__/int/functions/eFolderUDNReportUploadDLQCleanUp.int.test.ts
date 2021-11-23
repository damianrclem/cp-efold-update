// @ts-nocheck

import { GetQueueUrlCommand, SendMessageBatchCommand, SendMessageBatchRequestEntry, SQSClient,  } from "@aws-sdk/client-sqs";
import { handler } from "../../../src/functions/eFolderUDNReportUploadDLQCleanUp";

let OLD_ENV;

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
        const messages: SendMessageBatchRequestEntry[] = [
            {
                Id: "1",
                MessageBody: JSON.stringify({
                    detail: {
                        loan: {
                            id: "123"
                        }
                    }
                })
            }
        ];

        const sqsClient = new SQSClient({
            region: 'us-east-2'
        });

        const { QueueUrl } = await sqsClient.send(new GetQueueUrlCommand({
            QueueName: 'cp-efolder-upload-dev-eFolderUDNReportUpload-dlq'
        }));

        await sqsClient.send(new SendMessageBatchCommand({
            QueueUrl,
            Entries: messages
        }))

        await handler({}, {}, () => {})
    })
})