// @ts-nocheck

import { InvalidEventParamsError } from "../../../src/common/errors"
import { handler } from "../../../src/functions/saveEncompassLoan"

describe('saveEncompassLoan', () => {
    test('throws an InvalidEventParamsError if detail.requestPayload.detail.loan.id is missing on event detail', async () => {
        const invalidHandler = handler({}, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow('Required parameter detail.requestPayload.detail.loan.id is missing on event payload')
    })

    test("it does not blow up", async () => {
        await expect(handler({
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: '1'
                        }
                    }
                },
            }
        }, {}, () => {})).resolves.not.toThrowError();
    })
})