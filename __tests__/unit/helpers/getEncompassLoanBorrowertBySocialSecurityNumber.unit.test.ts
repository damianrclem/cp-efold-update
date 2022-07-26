// @ts-nocheck

import { getEncompassLoanBorrowerBySocialSecurityNumber, NoLoanApplicationsError, NoLoanBorrowerWithMatchingSSNError } from '../../../src/helpers/getEncompassLoanBorrowerBySocialSecurityNumber';

describe('getEncompassLoanBorrowerBySocialSecurityNumber', () => {
    test('returns the borrower on the loan with the specified social security number', () => {
        const ssn = '123456789';
        const loan = {
            applications: [
                {
                    id: 'appId',
                    borrower: {
                        fullName: 'Joe Mama',
                        taxIdentificationIdentifier: '123-45-6789'
                    }
                }
            ]
        }
        const borrower = getEncompassLoanBorrowerBySocialSecurityNumber(ssn, loan)

        expect(borrower).toEqual({
            applicationId: 'appId',
            taxIdentificationIdentifier: '123-45-6789',
            fullName: 'Joe Mama'
        })
    });

    test('returns the coborrower on the loan with the specified social security number', () => {
        const ssn = '098765432';
        const loan = {
            applications: [
                {
                    id: 'appId',
                    borrower: {
                        fullName: 'Joe Mama',
                        taxIdentificationIdentifier: '123-45-6789'
                    },
                    coborrower: {
                        fullName: 'Bert Erking',
                        taxIdentificationIdentifier: '098-76-5432'
                    }
                }
            ]
        }
        const borrower = getEncompassLoanBorrowerBySocialSecurityNumber(ssn, loan)

        expect(borrower).toEqual({
            applicationId: 'appId',
            taxIdentificationIdentifier: '098-76-5432',
            fullName: 'Bert Erking'
        })
    })

    test('throws an error if no borrowers have matching SSN', () => {
        const ssn = 'some bad value dude';
        const loan = {
            applications: [
                {
                    id: 'appId',
                    borrower: {
                        fullName: 'Joe Mama',
                        taxIdentificationIdentifier: '123-45-6789'
                    },
                    coborrower: {
                        fullName: 'Bert Erking',
                        taxIdentificationIdentifier: '098-76-5432'
                    }
                }
            ]
        }

        expect(() => getEncompassLoanBorrowerBySocialSecurityNumber(ssn, loan)).toThrow('socialSecurityNumber must be formatted xxx-xx-xxxx');
    });

    test('throws an error if no applications exist on the loan', () => {
        const ssn = 'random';
        const loan = {
            applications: []
        }

        expect(() => getEncompassLoanBorrowerBySocialSecurityNumber(ssn, loan)).toThrow(NoLoanApplicationsError);
    });
})