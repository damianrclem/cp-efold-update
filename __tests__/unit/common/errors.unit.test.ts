import { InvalidEventParamsError } from "../../../src/common/errors";

describe('InvalidEventParamsError', () => {
    test('it throws the correct event message', () => {
        const param = 'foo';
        const expectedMessage = `Required parameter ${param} is missing on event payload`;

        const test = () => {
            throw new InvalidEventParamsError(param);
        };
        expect(test).toThrow(expectedMessage);
    });

    test('it throws the correct event message with optional data parameter', () => {
        const param = 'bar';
        const expectedMessage = `Required parameter ${param} is missing on event payload`;

        const test = () => {
            throw new InvalidEventParamsError(param, { foo: 'bar' });
        };
        expect(test).toThrow(expectedMessage);
    })
})