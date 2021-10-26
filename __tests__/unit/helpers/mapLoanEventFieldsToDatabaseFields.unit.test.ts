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
            }
        }

        const result = mapLoanEventFieldsToDatabaseFields(event)

        expect(result).toEqual({
            Id: 'my id',
        })
    })
})