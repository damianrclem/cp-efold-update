import { ScheduledEvent, ScheduledHandler } from 'aws-lambda';
import { SQSClient, ReceiveMessageCommand, GetQueueUrlCommand, Message, DeleteMessageBatchCommand, DeleteMessageBatchRequestEntry, SendMessageBatchRequest, SendMessageBatchCommand, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';

interface LoanErrorMessage {
    id: string;
    loanId: string;
    receivedAt: Date;
    receiptHandle: string;
}

/**
 * Runs periodically to remove duplicate loans from the eFolderUDNReportDLQ
 * @param {ScheduledEvent} event
 * @returns {Promise<void>}
 */
export const handler: ScheduledHandler = async (event: ScheduledEvent): Promise<void> => {
    const region = get(process, 'env.REGION');
    if (!region) throw new Error('Environment missing region');

    const queueName = get(process, 'env.QUEUE_NAME');
    if (!queueName) throw new Error('Environment missing queue name');

    const sqsClient = new SQSClient({
        region
    });

    const { QueueUrl } = await sqsClient.send(new GetQueueUrlCommand({
        QueueName: queueName
    }))

    if (!QueueUrl) {
        throw new Error('No queue url found for queue name');
    }

    // Get all the messages from the DLQ
    const allMessages: Message[] = [];

    let pollForMessages = true;
    do {
        // NOTE: We can only get 10 messages per request.
        // That message will remain in flight until the Visibilty Timeout threshold has been crossed.
        // If it is, then those messages will come back in the next request and we may never make it to the end of the queue.
        // Because of this, no potentially long running requests should be happeneing here.

        const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
            QueueUrl,
        }));

        if (!Messages || Messages.length === 0) {
            pollForMessages = false;
            return;
        }

        Messages.forEach((message) => {
            allMessages.push(message);
        })
    }
    while (pollForMessages);

    const loanErrorMessages: LoanErrorMessage[] = [];
    allMessages.forEach((message: Message) => {
        if (!message.MessageId || !message.Body || !message.ReceiptHandle) {
            return;
        }

        const body = JSON.parse(message.Body);
        loanErrorMessages.push({
            id: message.MessageId,
            loanId: body.detail.loan.id,
            receivedAt: new Date(body.time),
            receiptHandle: message.ReceiptHandle
        })
    });

    const uniqueLoanErrorMessages: SendMessageBatchRequestEntry[] = [];

    const loanErrorMessagesGroupedByLoanId = groupBy(loanErrorMessages, (x) => x.loanId);
    Object.entries(loanErrorMessagesGroupedByLoanId).forEach((entry) => {
        const [_, errorMessages] = entry;
        const errorMessagesByReceivedDate = orderBy(errorMessages, (x => x.receivedAt), ['desc']);

        const mostRecentErrorMessage = errorMessagesByReceivedDate[0];
        const message = allMessages.find((x => x.MessageId === mostRecentErrorMessage.id));
        if (!message) {
            return;
        }

        uniqueLoanErrorMessages.push({
            Id: message.MessageId,
            MessageBody: message.Body
        });
    });

    await sqsClient.send(new SendMessageBatchCommand({
        QueueUrl,
        Entries: uniqueLoanErrorMessages
    }))
};