import { ScheduledEvent, ScheduledHandler } from 'aws-lambda';
import { SQSClient, ReceiveMessageCommand, GetQueueUrlCommand, Message, DeleteMessageBatchCommand, DeleteMessageBatchRequestEntry, SendMessageBatchRequest, SendMessageBatchCommand, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import filter from 'lodash/filter';
import groupBy from 'lodash/groupBy';
import { Dictionary } from 'lodash';

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
export const handler: ScheduledHandler = async (_: ScheduledEvent): Promise<void> => {
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
        // That message will remain in flight until the Visibilty Timeout threshold has been crossed. The threshold is currently 30 seconds.
        // If it is, then those messages will come back in the next request and we may never make it to the end of the queue.
        // Because of this, no potentially long running requests should be happeneing here.

        const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
            QueueUrl,
        }));

        if (!Messages || Messages.length === 0) {
            console.log("stop poling")
            pollForMessages = false;
            break;
        }

        Messages.forEach((message) => {
            allMessages.push(message);
        })
    }
    while (pollForMessages);

    // Parse the bodies of the messages to something we can sort and then get uniquely.
    const loanErrorMessages: LoanErrorMessage[] = [];
    allMessages.forEach((message: Message) => {
        // This should never happen, but these are potentially properties than can be undefined.
        if (!message.MessageId || !message.Body || !message.ReceiptHandle) {
            console.error(`Message did not have expected payload to deduplicate ${JSON.stringify(message)}`);
            return;
        }

        const body = JSON.parse(message.Body);

        if (!body.detail || !body.detail.loan || !body.detail.loan.id) {
            console.error(`Message body did not have required data needed to deduplicate ${JSON.stringify(message.Body)}`);
            return;
        }

        loanErrorMessages.push({
            id: message.MessageId,
            loanId: body.detail.loan.id,
            receivedAt: new Date(body.time),
            receiptHandle: message.ReceiptHandle
        })
    });

    // Let's now order the error messages by date, with the latest one being first.
    const errorMessagesSortedByReceivedDate = orderBy(loanErrorMessages, (x => x.receivedAt), ['desc']);

    // Group the messages by loanId.
    const sortedErrorMessagesGroupedByLoanId: Dictionary<LoanErrorMessage[]> = groupBy(errorMessagesSortedByReceivedDate, (x => x.loanId));

    console.log(sortedErrorMessagesGroupedByLoanId['123'].length)

    // Grab the duplicated errors.
    // Go through the entries of our dictionary.
    // For each entry, filter out the first values for each key. 
    // Since the entries are sorted by newest first, we just need to remove the first item in these arrays.
    const duplicatedErrorMessages: LoanErrorMessage[] = [];
    Object.values(sortedErrorMessagesGroupedByLoanId).forEach((errorMessageGrouping) => {
        errorMessageGrouping.forEach((errorMessage, index) => {
            if (index === 0) return;
            duplicatedErrorMessages.push(errorMessage)
        })
    })

    console.log("errorMessages", duplicatedErrorMessages.length);

    const messagesToRemove: DeleteMessageBatchRequestEntry[] = [];
    duplicatedErrorMessages.forEach((duplicateMessage) => {
        const message = allMessages.find((x => x.MessageId === duplicateMessage.id))
        if (!message) {
            return;
        }

        messagesToRemove.push({
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle
        })
    })

    await sqsClient.send(new DeleteMessageBatchCommand({
        QueueUrl,
        Entries: messagesToRemove
    }))
};