// @ts-nocheck

import { mapLoanEventFieldsToDatabaseFields } from "../../../src/helpers/mapLoanEventFieldsToDatabaseFields";

describe('mapLoanEventFieldsToDatabaseFields', () => {
    test('it maps correctly', () => {
        const event = {
            detail: {
                requestPayload: {
                    detail: {
                        loan: {
                            id: "my id",
                        }
                    }
                },
                responsePayload: {
                    detail: {
                        'borrowerFirstName': 'i',
                        'borrowerLastName': 'am',
                        'borrowerSsn': 'a',
                        'coBorrowerFirstName': 'different',
                        'coBorrowerLastName': 'value',
                        'coBorrowerSsn': 'than they are',
                    }
                }
            }
        }

        const result = mapLoanEventFieldsToDatabaseFields(event)

        expect(result).toEqual({
            Id: 'my id',
            BorrowerFirstName: 'i',
            BorrowerLastName: 'am',
            BorrowerSSN: 'a',
            CoborrowerFirstName: 'different',
            CoborrowerLastName: 'value',
            CoborrowerSSN: 'than they are',
        })
    })
})