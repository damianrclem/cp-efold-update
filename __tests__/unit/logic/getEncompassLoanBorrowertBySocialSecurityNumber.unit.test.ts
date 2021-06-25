import { getEncompassLoanBorrowerBySocialSecurityNumber, NoLoanApplicationsError, NoLoanBorrowerWithMatchingSSNError } from '../../../src/logic/getEncompassLoanBorrowerBySocialSecurityNumber';

describe('getEncompassLoanBorrowerBySocialSecurityNumber', () => {
    test('returns the borrower on the loan with the specified social security number', () => {
        const ssn = '123456789';
        const loan = {
            applications: [
                {
                    borrower: {
                        fullName: 'Joe Mama',
                        taxIdentificationNumber: '123-45-6789'
                    }
                }
            ]
        }
        const borrower = getEncompassLoanBorrowerBySocialSecurityNumber(ssn, loan)

        expect(borrower.taxIdentificationNumber).toEqual('123-45-6789');
        expect(borrower.fullName).toEqual("Joe Mama")
    });

    test('returns the coborrower on the loan with the specified social security number', () => {
        const ssn = '098765432';
        const loan = {
            applications: [
                {
                    borrower: {
                        fullName: 'Joe Mama',
                        taxIdentificationNumber: '123-45-6789'
                    },
                    coborrower: {
                        fullName: 'Bert Erking',
                        taxIdentificationNumber: '098-76-5432'
                    }
                }
            ]
        }
        const borrower = getEncompassLoanBorrowerBySocialSecurityNumber(ssn, loan)

        expect(borrower.taxIdentificationNumber).toEqual('098-76-5432');
        expect(borrower.fullName).toEqual("Bert Erking")
    })

    test('throws an error if no borrowers have matching SSN', () => {
        const ssn = 'some bad value dude';
        const loan = {
            applications: [
                {
                    borrower: {
                        fullName: 'Joe Mama',
                        taxIdentificationNumber: '123-45-6789'
                    },
                    coborrower: {
                        fullName: 'Bert Erking',
                        taxIdentificationNumber: '098-76-5432'
                    }
                }
            ]
        }

        expect(() => getEncompassLoanBorrowerBySocialSecurityNumber(ssn, loan)).toThrow(NoLoanBorrowerWithMatchingSSNError);
    });

    test('throws an error if no applications exist on the loan', () => {
        const ssn = 'random';
        const loan = {
            applications: []
        }

        expect(() => getEncompassLoanBorrowerBySocialSecurityNumber(ssn, loan)).toThrow(NoLoanApplicationsError);
    });
})