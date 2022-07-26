import { LoggerError } from "@revolutionmortgage/rm-logger"

interface Borrower {
    fullName: string
    taxIdentificationIdentifier: string
    applicationId: string;
}

interface Application {
    id: string
    borrower: Borrower
    coborrower?: Borrower
}

export class NoLoanApplicationsError extends LoggerError {
    constructor(data: any) {
        super('No applications exist on loan', data)
    }
}

export class NoLoanBorrowerWithMatchingSSNError extends LoggerError {
    constructor(data: any) {
        super('No borrower on the loan matches the specified SSN', data)
    }
}

/**
 * Gets a borrower on the loan by social security number
 * @param {string} socialSecurityNumber - The social security number to find the borrower
 * @param {Array<Application>} applications - The applications to search
 * @param {'borrower' | 'coborrower'} borrowerType - The applications on the loan
 * @returns {Borrower | undefined}
 */
const getBorrower = (
    socialSecurityNumber: string,
    applications: Array<Application>,
    borrowerType: 'borrower' | 'coborrower'
): Borrower | undefined => {
    const application = applications.find((application: Application) => application[borrowerType]?.taxIdentificationIdentifier === socialSecurityNumber);
    if (!application) {
        return;
    }

    const borrower = application[borrowerType];
    if (!borrower) {
        return;
    }

    return {
        fullName: borrower.fullName,
        taxIdentificationIdentifier: borrower.taxIdentificationIdentifier,
        applicationId: application.id
    };
}

/**
 * Gets a borrower on the loan by social security number
 * @param {string} socialSecurityNumber - The social security number to find the borrower
 * @param {Object} loan - The social security number to find the borrower
 * @param {Array<Application>} loan.applications - The applications on the loan
 * @returns {Borrower}
 */
export const getEncompassLoanBorrowerBySocialSecurityNumber = (
    socialSecurityNumber: string,
    loan: {
        applications: Array<Application>
    }
): Borrower => {
    const { applications } = loan;
    if (!applications || applications.length === 0) {
        throw new NoLoanApplicationsError(loan);
    }

    const formattedSocialSecurityNumber = socialSecurityNumber.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{2})(\d{4})/g, '$1-$2-$3');
    if (!(/\d{3}-\d{2}-\d{4}/.test(formattedSocialSecurityNumber))) {
        throw new Error('socialSecurityNumber must be formatted xxx-xx-xxxx');
    }

    // Find matching borrowers first
    const applicationWithMatchingBorrower = getBorrower(formattedSocialSecurityNumber, applications, 'borrower');
    if (applicationWithMatchingBorrower) {
        return applicationWithMatchingBorrower;
    }

    // If we did not find any matching borrowers, check the applications coborrowers
    const applicationWithMatchingCoborrower = getBorrower(formattedSocialSecurityNumber, applications, 'coborrower');
    if (applicationWithMatchingCoborrower) {
        return applicationWithMatchingCoborrower;
    }

    // If we did not find anything, throw an Error
    throw new NoLoanBorrowerWithMatchingSSNError(loan);
}