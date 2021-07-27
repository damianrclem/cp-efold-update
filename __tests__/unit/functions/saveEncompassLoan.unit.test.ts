// @ts-nocheck

import { InvalidEventParamsError } from "../../../src/common/errors"
import { handler } from "../../../src/functions/saveEncompassLoan"

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

    test("throws an InvalidEventParamsError if loan.fields['4004'] is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                loan: {
                    id: '1',
                    fields: {
                        '4000': 'bert',
                        '4002': 'mcmuffin',
                        '65': 'he do not know it'
                    }
                },
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.loan.fields['4004'] is missing on event payload")
    })

    test("throws an InvalidEventParamsError if loan.fields['4006'] is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                loan: {
                    id: '1',
                    fields: {
                        '4000': 'bert',
                        '4002': 'mcmuffin',
                        '65': 'he do not know it',
                        '4004': 'no body co signing for this dude',
                    }
                },
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.loan.fields['4006'] is missing on event payload")
    })

    test("throws an InvalidEventParamsError if loan.fields['97'] is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                loan: {
                    id: '1',
                    fields: {
                        '4000': 'bert',
                        '4002': 'mcmuffin',
                        '65': 'he do not know it',
                        '4004': 'no body co signing for this dude',
                        '4006': 'bertbertybert'
                    }
                },
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.loan.fields['97'] is missing on event payload")
    })
})