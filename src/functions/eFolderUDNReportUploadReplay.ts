import { SQSHandler, SQSEvent, SQSRecord } from 'aws-lambda';
import { SQSClient, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { EventBridgeClient, PutEventsCommand, PutEventsCommandOutput, PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import get from 'lodash/get';

/**
 * Replays the event by bumping the retires count and putting it back on the event bus
 * @param {SQSEvent} event
 * @returns {Promise<void>}
 */
export const handler: SQSHandler = async (event: SQSEvent): Promise<any> => {
    const region = get(process, 'env.REGION');
    if (!region) throw new Error('Environment missing region');

    const eventBus = get(process, 'env.CP_EVENT_BUS');
    if (!eventBus) throw new Error('Environment missing event bus name');

    const records = get(event, 'Records') ?? [];

    const eventBridgeClient = new EventBridgeClient({
        region,
    }); 

    records.forEach(async (record: SQSRecord): Promise<void> => {
        const body = get(record, 'body') ?? '{}';
        const event = JSON.parse(body);

        const detailType = get(event, 'detail-type');
        if (!detailType) throw new Error('Event missing detail-type');

        const source = get(event, 'source');
        if (!source) throw new Error('Event missing source');

        const detail = get(event, 'detail');
        if (!detail) throw new Error('Event missing detail');

        // Grab it, incrememnt it
        const retries = (get(detail, 'retries') ?? 0) + 1;

        await eventBridgeClient.send(new PutEventsCommand({
            Entries: [{
                Detail: JSON.stringify(Object.assign({}, detail, {
                    retries,
                })),
                DetailType: detailType,
                EventBusName: eventBus,
                Source: source
            }],
        }))

        const receiptHandler = get(record, 'receiptHandle');
        // This should never happen, but if it does, we move on to the next record — the message will get removed from the queue upon
        // successful completion of the lambda
        if (!receiptHandler) 
            return;
        // If any record in a batch fails, all messages in that batch remain on the queue, even if they were already
        // processed. This line removes successfully processed records from the queue so they're not re-processed in
        // the event another record in the batch fails.
        await removeFromQueue(receiptHandler);
    });
};
/**
 * Clear the message from the queue
 * @param {string} receiptHandler 
 */
 const removeFromQueue = async (receiptHandler: string): Promise<void> => {
    const region = get(process, 'env.REGION');
    if (!region) throw new Error('Environment missing REGION variable');

    const accountId = get(process, 'env.ACCOUNT_ID');
    if (!accountId) throw new Error('Environment missing ACCOUNT_ID variable');

    const queueName = get(process, 'env.QUEUE_NAME');
    if (!queueName) throw new Error('Environment missing QUEUE_NAME variable');

    const sqs = new SQSClient({
        region,
    });
    await sqs.send(new DeleteMessageCommand({
        ReceiptHandle: receiptHandler,
        QueueUrl: `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`,
    }));
};