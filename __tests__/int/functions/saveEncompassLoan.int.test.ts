// @ts-nocheck

import { InvalidEventParamsError } from "../../../src/common/errors"
import { handler } from "../../../src/functions/saveEncompassLoan"

describe('saveEncompassLoan', () => {
    test('throws an InvalidEventParamsError if detail.requestPayload.detail.loan.id is missing on event detail', async () => {
        const invalidHandler = handler({}, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow('Required parameter detail.requestPayload.detail.loan.id is missing on event payload')
    })

    test("throws an InvalidEventParamsError if detail.responsePayload.borrowerFirstName is missing on event detail", async () => {
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
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.responsePayload.borrowerFirstName is missing on event payload")
    })

    test("throws an InvalidEventParamsError if detail.responsePayload.borrowerLastName is missing on event detail", async () => {
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
                    borrowerFirstName: 'bert'
                }
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.responsePayload.borrowerLastName is missing on event payload")
    })

    test("throws an InvalidEventParamsError if detail.responsePayload.borrowerSsn is missing on event detail", async () => {
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
                    borrowerFirstName: 'bert',
                    borrowerLastName: 'not bet'
                }
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.responsePayload.borrowerSsn is missing on event payload")
    })

    test("throws an InvalidEventParamsError if detail.responsePayload.vendorOrderIdentifier is missing on event detail", async () => {
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
                    borrowerFirstName: 'bert',
                    borrowerLastName: 'not bet',
                    borrowerSsn: '123'
                }
            }
        }, {}, () => {})

        await expect(invalidHandler).rejects.toThrow(InvalidEventParamsError);
        await expect(invalidHandler).rejects.toThrow("Required parameter detail.responsePayload.vendorOrderIdentifier is missing on event payload")
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
                responsePayload: {
                    borrowerFirstName: 'bert',
                    borrowerLastName: 'not bet',
                    borrowerSsn: '123',
                    vendorOrderIdentifier: '123456'
                }
            }
        }, {}, () => {})).resolves.not.toThrowError();
    })
})