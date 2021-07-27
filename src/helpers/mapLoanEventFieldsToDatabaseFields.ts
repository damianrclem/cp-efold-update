interface LoanItem {
    Id: string;
    BorrowerFirstName: string;
    BorrowerLastName: string;
    BorrowerSSN: string;
    CoborrowerFirstName: string;
    CoborrowerLastName: string;
    CoborrowerSSN: string;
}

/**
 * 
 * @param loan - The loan from the event payload
 * @returns {LoanItem} The loan to save to the database
 */
export const mapLoanEventFieldsToDatabaseFields = (loan: { [key: string]: any }): LoanItem => {
    return {
        Id: loan.id,
        BorrowerFirstName: loan.fields['4000'],
        BorrowerLastName: loan.fields['4002'],
        BorrowerSSN: loan.fields['65'],
        CoborrowerFirstName: loan.fields['4004'],
        CoborrowerLastName: loan.fields['4006'],
        CoborrowerSSN: loan.fields['97']
    }
}