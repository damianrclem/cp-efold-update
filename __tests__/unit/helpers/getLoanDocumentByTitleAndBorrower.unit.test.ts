import { getLoanDocumentByTitle } from '../../../src/helpers/getLoanDocumentByTitle';

describe('getLoanDocumentByTitleAndBorrowerName', () => {
    const loanDocuments = [{
        id: 'boop',
        title: 'hello',
        application: {
            entityName: 'Bert McDonald'
        }
    }]

    test('it returns the loan document if the title and borrower name match', () => {
        const result = getLoanDocumentByTitle(loanDocuments, 'hello');
        expect(result).toEqual(loanDocuments[0]);
    });

    test('it returns undefined if the title does not match', () => {
        const result = getLoanDocumentByTitle(loanDocuments, 'goodbye');
        expect(result).toEqual(undefined);
    });
})