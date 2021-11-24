import { GetQueueUrlCommand, SQSClient, Message, ReceiveMessageCommand } from "@aws-sdk/client-sqs"

interface GetAllMessagesParams {
    queueName: string;
    region: string;
}

/**
 * Get all messages in a SQS queue.
 * 
 * NOTE: This request has to get the messages in batches of 10. 
 * That batch of messages will remain in flight until the Visibilty Timeout threshold has been crossed.
 * If the threshold is crossed, then those messages will come back in the next request and we may never make it to the end of the queue.
 * @param {GetAllMessagesParams} params - The paramenters required to get all the messages in a SQS queue.
 * @param {string} params.region - The region the queue resides.
 * @param {string} params.queueName - The name of the queue.
 * @returns {Promise<Message[]>} A Promise of all of the messages in the queue.
 */
export const getAllMessages = async (params: GetAllMessagesParams): Promise<Message[]> => {
    const sqsClient = new SQSClient({
        region: params.region,
    });

    const { QueueUrl } = await sqsClient.send(new GetQueueUrlCommand({
        QueueName: params.queueName
    }));

    if (!QueueUrl) {
        throw new Error(`No queue url found for queue ${params.queueName}`);
    }

    const allMessages: Message[] = [];

    let pollForMessages = true;
    do {
        // NOTE: We can only get 10 messages per request.
        const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
            QueueUrl,
        }));

        if (!Messages || Messages.length === 0) {
            pollForMessages = false;
            break;
        }

        Messages.forEach((message) => {
            allMessages.push(message);
        })
    }
    while (pollForMessages);

    return allMessages;
}