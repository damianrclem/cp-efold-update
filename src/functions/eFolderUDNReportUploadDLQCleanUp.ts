import { ScheduledEvent, ScheduledHandler } from 'aws-lambda';
import { Message, DeleteMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import get from 'lodash/get';
import { deleteMessages, getAllMessages } from '../common/sqs';
import { getDuplicatedLoanErrorMessages } from '../helpers/getDuplicatedLoanErrorMessages';

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

    // Get all the messages from the DLQ
    const allMessages: Message[] = await getAllMessages({
        region,
        queueName,
    });

    // Parse the bodies of the messages to something we can sort and then get uniquely.
    const duplicateMessages = getDuplicatedLoanErrorMessages(allMessages);

    const messagesToRemove: DeleteMessageBatchRequestEntry[] = duplicateMessages.map((message) => {
        return {
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle
        }
    })

    // We can only request to delete 10 messages at a time. So, we need to do this in batches.
    await deleteMessages({
        region,
        queueName,
        messages: messagesToRemove
    });

    console.log(`${messagesToRemove.length} duplicate errors removed from the queue.`)
};