import { LoggerError } from "@revolutionmortgage/rm-logger"

interface Borrower {
    fullName: string
    taxIdentificationNumber: string
    applicationId: string;
}

interface Application {
    id: string
    borrower: Borrower
    coborrower?: Borrower
}

export class NoLoanApplicationsError extends LoggerError {
    constructor(data: any) {
        super('No applicants exist on loan', data)
    }
}

export class NoLoanBorrowerWithMatchingSSNError extends LoggerError {
    constructor(data: any) {
        super('No borrower on the loan matches the specifiec SSN', data)
    }
}

const formatAsSocialSecurityNumber = (socialSecurityNumber: string): string => {
    let formattedSSN: string = socialSecurityNumber.replace(/\D/g, '');
    formattedSSN = formattedSSN.replace(/^(\d{3})/, '$1-');
    formattedSSN = formattedSSN.replace(/-(\d{2})/, '-$1-');
    formattedSSN = formattedSSN.replace(/(\d)-(\d{4}).*/, '$1-$2');
    return formattedSSN;
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
    const formattedSSN = formatAsSocialSecurityNumber(socialSecurityNumber);
    const application = applications.find((application: Application) => application[borrowerType]?.taxIdentificationNumber === formattedSSN);
    if (!application) {
        return;
    }

    const borrower = application[borrowerType];
    if (!borrower) {
        return;
    }

    return {
        fullName: borrower.fullName,
        taxIdentificationNumber: borrower.taxIdentificationNumber,
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

    // Find matching borrowers first
    const applicationWithMatchingBorrower = getBorrower(socialSecurityNumber, applications, 'borrower');
    if (applicationWithMatchingBorrower) {
        return applicationWithMatchingBorrower;
    }

    // If we did not find any matching borrowers, check the applications coborrowers
    const applicationWithMatchingCoborrower = getBorrower(socialSecurityNumber, applications, 'coborrower');
    if (applicationWithMatchingCoborrower) {
        return applicationWithMatchingCoborrower;
    }

    // If we did not find anything, throw an Error
    throw new NoLoanBorrowerWithMatchingSSNError(loan);
}