// @ts-nocheck

import { InvalidEventParamsError } from "../../../src/common/errors"
import { handler } from "../../../src/functions/saveEncompassLoan"
import { mapLoanEventFieldsToDatabaseFields } from "../../../src/helpers/mapLoanEventFieldsToDatabaseFields"

jest.mock('../../../src/helpers/mapLoanEventFieldsToDatabaseFields', () => ({
    mapLoanEventFieldsToDatabaseFields: jest.fn(),
}))

jest.mock('../../../src/common/database', () => ({
    putItem: jest.fn()
}))

describe('saveEncompassLoan', () => {
    test('throws an InvalidEventParamsError if detail.requestPayload.detail.loan.id is missing on event detail', async () => {
        const invalidHandler = handler({}, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow('Required parameter detail.requestPayload.detail.loan.id is missing on event payload')
    })

    test("it does not blow up", async () => {
        mapLoanEventFieldsToDatabaseFields.mockReturnValue({
            Id: 'foo',
        })

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