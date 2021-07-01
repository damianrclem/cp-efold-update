import { SQSHandler, SQSEvent, SQSRecord } from 'aws-lambda';
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

    let events: Promise<PutEventsCommandOutput>[] = [];

    const records = get(event, 'Records') ?? [];

    const entries: Array<PutEventsRequestEntry> = records.map((record: SQSRecord): PutEventsRequestEntry => {
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

        return {
            Detail: JSON.stringify(Object.assign({}, detail, {
                retries,
            })),
            DetailType: detailType,
            EventBusName: eventBus,
            Source: source
        }
    });

    const client = new EventBridgeClient({
        region,
    });

    events.push(client.send(new PutEventsCommand({
        Entries: entries,
    })))
};