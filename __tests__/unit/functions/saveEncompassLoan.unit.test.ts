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
    test('throws an InvalidEventParamsError if loan.id is missing on event detail', async () => {
        const invalidHandler = handler({}, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow('Required parameter detail.loan.id is missing on event payload')
    })

    test("throws an InvalidEventParamsError if loan.fields['4000'] is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                loan: {
                    id: '1'
                }
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.loan.fields['4000'] is missing on event payload")
    })

    test("throws an InvalidEventParamsError if loan.fields['4002'] is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                loan: {
                    id: '1',
                    fields: {
                        '4000': 'bert'
                    }
                },
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.loan.fields['4002'] is missing on event payload")
    })

    test("throws an InvalidEventParamsError if loan.fields['65'] is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                loan: {
                    id: '1',
                    fields: {
                        '4000': 'bert',
                        '4002': 'mcmuffin'
                    }
                },
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.loan.fields['65'] is missing on event payload")
    })

    test("it does not blow up", async () => {
        mapLoanEventFieldsToDatabaseFields.mockReturnValue({
            Id: 'foo',
        })

        await expect(handler({
            detail: {
                loan: {
                    id: '1',
                    fields: {
                        '4000': 'bert',
                        '4002': 'mcmuffin',
                        '65': 'hfhf',
                    }
                },
            }
        }, {}, () => {})).resolves.not.toThrowError();
    })
})