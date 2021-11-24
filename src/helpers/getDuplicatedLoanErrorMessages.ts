import { Message } from "@aws-sdk/client-sqs";
import orderBy from 'lodash/orderBy';
import groupBy from 'lodash/groupBy';
import { Dictionary } from 'lodash';

interface LoanErrorMessage {
    id: string;
    loanId: string;
    receivedAt: Date;
    receiptHandle: string;
}

export const getDuplicatedLoanErrorMessages = (messages: Message[]): Message[] => {
    // Parse the bodies of the messages to something we can sort and then get uniquely.
    const loanErrorMessages: LoanErrorMessage[] = [];
    messages.forEach((message: Message) => {
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
    });

    // Now that we have the duplicated messages, get the original SQS message object and return that.
    const messagesToRemove: Message[] = [];
    duplicatedErrorMessages.forEach((duplicateMessage) => {
        const message = messages.find((x => x.MessageId === duplicateMessage.id))
        if (!message) {
            return;
        }

        messagesToRemove.push(message)
    });

    return messagesToRemove;
}