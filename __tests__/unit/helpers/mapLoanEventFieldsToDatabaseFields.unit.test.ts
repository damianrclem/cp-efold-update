import { mapLoanEventFieldsToDatabaseFields } from "../../../src/helpers/mapLoanEventFieldsToDatabaseFields";

describe('mapLoanEventFieldsToDatabaseFields', () => {
    test('it maps correctly', () => {
        const loan = {
            id: 'my id',
            fields: {
                '4000': 'i',
                '4002': 'am',
                '65': 'a',
                '4004': 'different',
                '4006': 'value',
                '97': 'than they are',
            }
        }

        const result = mapLoanEventFieldsToDatabaseFields(loan)

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