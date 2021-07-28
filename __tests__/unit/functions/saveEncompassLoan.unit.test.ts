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

    test("throws an InvalidEventParamsError if detail.responsePayload.detail.borrowerFirstName is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: '1'
                        }
                    }
                }
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.responsePayload.detail.borrowerFirstName is missing on event payload")
    })

    test("throws an InvalidEventParamsError if detail.responsePayload.detail.borrowerLastName is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: '1'
                        }
                    }
                },
                responsePayload: {
                    detail: {
                        borrowerFirstName: 'bert'
                    }
                }
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.responsePayload.detail.borrowerLastName is missing on event payload")
    })

    test("throws an InvalidEventParamsError if detail.responsePayload.detail.borrowerSsn is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: '1'
                        }
                    }
                },
                responsePayload: {
                    detail: {
                        borrowerFirstName: 'bert',
                        borrowerLastName: 'not bet'
                    }
                }
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.responsePayload.detail.borrowerSsn is missing on event payload")
    })

    test("throws an InvalidEventParamsError if detail.responsePayload.detail.vendorOrderIdentifier is missing on event detail", async () => {
        const invalidHandler = handler({
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: '1'
                        }
                    }
                },
                responsePayload: {
                    detail: {
                        borrowerFirstName: 'bert',
                        borrowerLastName: 'not bet',
                        borrowerSsn: '123'
                    }
                }
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.responsePayload.detail.vendorOrderIdentifier is missing on event payload")
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
                responsePayload: {
                    detail: {
                        borrowerFirstName: 'bert',
                        borrowerLastName: 'not bet',
                        borrowerSsn: '123',
                        vendorOrderIdentifier: '123456'
                    }
                }
            }
        }, {}, () => {})).resolves.not.toThrowError();
    })
})