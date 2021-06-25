import { LoggerError } from "@revolutionmortgage/rm-logger"

interface Borrower {
    fullName: string
    taxIdentificationNumber: string
}

interface Applications {
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
 * @param {Object} loan - The social security number to find the borrower
 * @param {Array<Applications>} loan.applications - The applications on the loan
 * @returns {Borrower}
 */
export const getEncompassLoanBorrowerBySocialSecurityNumber = (
    socialSecurityNumber: string,
    loan: {
        applications: Array<Applications>
    }
): Borrower => {
    const { applications } = loan;
    if (!applications || applications.length === 0) {
        throw new NoLoanApplicationsError(loan);
    }

    const formattedSSN = formatAsSocialSecurityNumber(socialSecurityNumber);
    console.log(socialSecurityNumber, formattedSSN)

    // Find matching borrowers first
    const applicationWithMatchingBorrower = applications.find((application: Applications) => application.borrower.taxIdentificationNumber === formattedSSN)
    if (applicationWithMatchingBorrower?.borrower) {
        return applicationWithMatchingBorrower.borrower;
    }

    // If we did not find any matching borrowers, check the applications coborrowers
    const applicationWithMatchingCoborrower = applications.find((application: Applications) => application.coborrower && application.coborrower.taxIdentificationNumber === formattedSSN)
    if (applicationWithMatchingCoborrower?.coborrower) {
        return applicationWithMatchingCoborrower.coborrower;
    }

    // If we did not find anything, throw an Error
    throw new NoLoanBorrowerWithMatchingSSNError(loan);
}