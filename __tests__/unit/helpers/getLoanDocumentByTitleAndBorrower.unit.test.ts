import { getLoanDocumentByTitleAndBorrowerName } from '../../../src/helpers/getLoanDocumentByTitleAndBorrowerName';

describe('getLoanDocumentByTitleAndBorrowerName', () => {
    const loanDocuments = [{
        id: 'boop',
        title: 'hello',
        application: {
            entityName: 'Bert McDonald'
        }
    }]

    test('it returns the loan document if the title and borrower name match', () => {
        const result = getLoanDocumentByTitleAndBorrowerName(loanDocuments, 'hello', 'Bert McDonald');
        expect(result).toEqual(loanDocuments[0]);
    });

    test('it returns undefined if the title matches and borrower name does not match', () => {
        const result = getLoanDocumentByTitleAndBorrowerName(loanDocuments, 'goodbye', 'Bert McDoland');
        expect(result).toEqual(undefined);
    });

    test('it returns undefined if the title does not match and the borrower name does', () => {
        const result = getLoanDocumentByTitleAndBorrowerName(loanDocuments, 'hello', 'Jeanie Black');
        expect(result).toEqual(undefined);
    });

    test('it returns undefined if both the title and borrower name does not match', () => {
        const result = getLoanDocumentByTitleAndBorrowerName(loanDocuments, 'Microsoft Sucks', 'Satya Nadella');
        expect(result).toEqual(undefined);
    });
})