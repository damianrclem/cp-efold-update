import { Message } from "@aws-sdk/client-sqs";
import { v4 as uuid } from "uuid";
import { getDuplicatedLoanErrorMessages } from "../../../src/helpers/getDuplicatedLoanErrorMessages";
import { randomNumberFromInterval } from "../../randomNumberFromInterval";

describe('getDuplicatedLoanErrorMessages', () => {
    test('it filters out duplicated loan error messages', () => {
        const numberOfUniqueMessages = randomNumberFromInterval(1, 5);
        const numberOfDuplicatesPerUniqueMessage = randomNumberFromInterval(1, 10);
        const testMessages: Message[] = [];

        for (let index = 0; index < numberOfUniqueMessages; index++) {
            const loanId = uuid();
            const message: Message = {
                MessageId: uuid(),
                Body: JSON.stringify({
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
                }),
                ReceiptHandle: 'test'
            }
            testMessages.push(message)

            for (let index = 0; index < numberOfDuplicatesPerUniqueMessage; index++) {
                const message: Message = {
                    MessageId: uuid(),
                    Body: JSON.stringify({
                        time: new Date().toString(),
                        detail: {
                            requestPayload: {
                                loan: {
                                    id: loanId
                                }
                            }
                        }
                    }),
                    ReceiptHandle: 'test'
                }
                testMessages.push(message)
            }
        }

        const result = getDuplicatedLoanErrorMessages(testMessages);

        expect(result.length).toEqual(testMessages.length - numberOfUniqueMessages);
    })
});