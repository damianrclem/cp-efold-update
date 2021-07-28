interface LoanDocument {
    id: string;
    title: string;
    application: {
        entityName: string;
    }
    attachments: Array<{
        id: string;
    }>;
}

/**
 * Get a loan document by title and borrower's full name
 * @param {Array<LoanDocument>} loanDocuments - The loan documents to search
 * @param {string} title - The title
 * @returns {LoanDocument | undefined}
 */
export const getLoanDocumentByTitle = (loanDocuments: Array<LoanDocument>, title: string): LoanDocument | undefined => {
    return loanDocuments.find((document: LoanDocument) => document.title === title);
}