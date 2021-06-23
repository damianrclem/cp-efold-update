import { EventBridgeHandler, EventBridgeEvent } from 'aws-lambda';

interface Detail {
    // Shape of event detail goes here
}

interface Response {
    // Shape of lambda response goes here — This will end up in destination
}

type Handler = EventBridgeHandler<'Loan', Detail, Promise<Response>>;

type Event = EventBridgeEvent<'Loan', Detail>;

/**
 * An example Event Bridge Lambda
 * @param {Event} event
 * @returns {Promise<Response>}
 */
export const handler: Handler = async (event: Event): Promise<Response> => {
    return {}
};
