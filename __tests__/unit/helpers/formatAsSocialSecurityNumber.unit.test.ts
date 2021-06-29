import { formatAsSocialSecurityNumber } from "../../../src/helpers/formatAsSocialSecurityNumber";

describe('formatAsSocialSecurityNumber', () => {
    test('it works', () => {
        const ssnToFormat = '111223333';
        const result = formatAsSocialSecurityNumber(ssnToFormat);
        expect(result).toEqual('111-22-3333');
    })
})