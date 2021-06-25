interface LoanDocument {
    id: string;
    title: string;
    application: {
        entityName: string;
    }
}

/**
 * Get a loan document by title and borrower's full name
 * @param {Array<LoanDocument>} loanDocuments - The loan documents to search
 * @param {string} title - The title
 * @param {string} borrowerFullName - The borrow's full name
 * @returns {Promise<void>}
 */
export const getLoanDocumentByTitleAndBorrowerName = (loanDocuments: Array<LoanDocument>, title: string, borrowerFullName: string) => {
    return loanDocuments.find((document: LoanDocument) => document.title === title && document.application.entityName === borrowerFullName);
}