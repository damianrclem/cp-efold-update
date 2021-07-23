// @ts-nocheck
import { handler, InvalidParamsError, LoanDocumentForUDNReportsNotFoundError, LoanNotFoundError } from '../../../src/functions/eFolderUDNReportUpload';
import { getLoan, getLoanDocuments, createLoanDocument } from "../../../src/clients/encompass";
import { getEncompassLoanBorrowerBySocialSecurityNumber } from "../../../src/helpers/getEncompassLoanBorrowerBySocialSecurityNumber";
import { getLoanDocumentByTitle } from "../../../src/helpers/getLoanDocumentByTitle";
import { getUDNReport } from "../../../src/helpers/getUDNReport";
import { getItem, putItem } from '../../../src/common/database';
import { AUDIT_FIELDS } from '../../../src/common/constants';

jest.mock('../../../src/clients/encompass', () => ({
    getLoan: jest.fn(),
    getLoanDocuments: jest.fn(),
    createLoanDocument: jest.fn()
}))

jest.mock("../../../src/helpers/getEncompassLoanBorrowerBySocialSecurityNumber", () => ({
    getEncompassLoanBorrowerBySocialSecurityNumber: jest.fn()
}))

jest.mock("../../../src/helpers/getLoanDocumentByTitle", () => ({
    getLoanDocumentByTitle: jest.fn()
}))

jest.mock("../../../src/helpers/uploadUDNReportToEFolder", () => ({
    uploadUDNReportToEFolder: jest.fn()
}))

jest.mock("../../../src/helpers/getUDNReport", () => ({
    getUDNReport: jest.fn()
}))

jest.mock("../../../src/common/database", () => ({
    getItem: jest.fn(),
    putItem: jest.fn(),
}))

describe('eFolderUDNReportUpload', () => {
    test('it throws an InvalidParamsError if the loanId is not on the event detail payload', async () => {
        const handlerWithNoLoanId = handler({}, {}, () => { });

        await expect(handlerWithNoLoanId).rejects.toThrow(InvalidParamsError);
        await expect(handlerWithNoLoanId).rejects.toThrow('loanId missing on event detail');
    });

    test('it throws an InvalidParamsError if fields is not on the event detail payload', async () => {
        const handlerWithNoFields = handler({
            detail: {
                loan: {
                    id: '123'
                }
            }
        }, {}, () => { })

        await expect(handlerWithNoFields).rejects.toThrow(InvalidParamsError);
        await expect(handlerWithNoFields).rejects.toThrow('fields missing on event detail');
    });

    test('it throws a LoanNotFoundError if no loan was found in the database', async () => {
        await expect(handler({
            detail: {
                loan: {
                    id: '123',
                    fields: {}
                }
            }
        }, {}, () => { })).rejects.toThrow(LoanNotFoundError);
    });

    test('it does not throw an error if the loan audit fields have not changed', async () => {
        const testItem = {};
        const fields = {};
        AUDIT_FIELDS.forEach((field) => {
            const value = new Date().toString();
            testItem[field] = value;
            fields[field] = value;
        })

        
        getItem.mockResolvedValue({
            Item: testItem
        })

        await expect(handler({
            detail: {
                loan: {
                    id: '123',
                    fields: fields
                }
            }
        }, {}, () => { })).resolves.not.toThrowError();
    })

    test('it does not throw an error if there is an existing loan document to upload to', async () => {
        getItem.mockResolvedValue({
            Item: {
                [AUDIT_FIELDS[0]]: 'whatever'
            }
        })
        
        getLoan.mockResolvedValue({
            data: {}
        });

        getEncompassLoanBorrowerBySocialSecurityNumber.mockReturnValue({
            application: '123',
            fullName: 'bert',
        })

        getLoanDocuments.mockResolvedValue({
            data: {}
        })

        getUDNReport.mockResolvedValue('i am a pdf')

        getLoanDocumentByTitle.mockReturnValue({
            id: 'hey yo'
        })

        await expect(handler({
            detail: {
                loan: {
                    id: '123',
                    fields: {}
                }
            }
        }, {}, () => { })).resolves.not.toThrowError();
    });

    test('it does not throw an error if there is NOT an existing loan document to upload to', async () => {
        getItem.mockResolvedValue({
            Item: {
                [AUDIT_FIELDS[0]]: 'whatever'
            }
        })
        
        getLoan.mockResolvedValue({
            data: {}
        })

        getEncompassLoanBorrowerBySocialSecurityNumber.mockReturnValue({
            application: '123',
            fullName: 'bert',
        })

        getLoanDocuments.mockResolvedValue({
            data: {}
        })

        createLoanDocument.mockResolvedValue({
            data: {}
        })

        getLoanDocumentByTitle
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce({
                id: 'hey yo'
            })

        getUDNReport.mockResolvedValue('i am a pdf')

        await expect(handler({
            detail: {
                loan: {
                    id: '123',
                    fields: {}
                }
            }
        }, {}, () => { })).resolves.not.toThrowError();
    });

    test('it does throw an error if no document was found to upload to', async () => {
        getItem.mockResolvedValue({
            Item: {
                [AUDIT_FIELDS[0]]: 'whatever'
            }
        })

        getLoan.mockResolvedValue({
            data: {}
        })

        getEncompassLoanBorrowerBySocialSecurityNumber.mockReturnValue({
            application: '123',
            fullName: 'bert',
        })

        getLoanDocuments.mockResolvedValue({
            data: {}
        })

        createLoanDocument.mockResolvedValue({
            data: {}
        })

        getLoanDocumentByTitle.mockReturnValue(undefined);

        getUDNReport.mockResolvedValue('I am a pdf')

        await expect(handler({
            detail: {
                loan: {
                    id: '123',
                    fields: {}
                }
            }
        }, {}, () => { })).rejects.toThrow(LoanDocumentForUDNReportsNotFoundError);
    });

    test('it does not throw an error if there is a Coborrower and an existing loan document to upload to', async () => {
        getItem.mockResolvedValue({
            Item: {
                [AUDIT_FIELDS[0]]: 'whatever',
                CoborrowerFirstName: 'Billy',
                CoborrowerLastName: 'Bob',
                CoborrowerSSN: 'the clown'
            }
        })
        
        getLoan.mockResolvedValue({
            data: {}
        });

        getEncompassLoanBorrowerBySocialSecurityNumber.mockReturnValue({
            application: '123',
            fullName: 'bert',
        })

        getLoanDocuments.mockResolvedValue({
            data: {}
        })

        getUDNReport.mockResolvedValue('i am a pdf')

        getLoanDocumentByTitle.mockReturnValue({
            id: 'hey yo'
        })

        await expect(handler({
            detail: {
                loan: {
                    id: '123',
                    fields: {}
                }
            }
        }, {}, () => { })).resolves.not.toThrowError();
    });

    test('it does not throw an error if there is a Coborrower and NOT an existing loan document to upload to', async () => {
        getItem.mockResolvedValue({
            Item: {
                [AUDIT_FIELDS[0]]: 'whatever',
                CoborrowerFirstName: 'Billy',
                CoborrowerLastName: 'Bob',
                CoborrowerSSN: 'the clown'
            }
        })
        
        getLoan.mockResolvedValue({
            data: {}
        })

        getEncompassLoanBorrowerBySocialSecurityNumber.mockReturnValue({
            application: '123',
            fullName: 'bert',
        })

        getLoanDocuments.mockResolvedValue({
            data: {}
        })

        createLoanDocument.mockResolvedValue({
            data: {}
        })

        getLoanDocumentByTitle
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce({
                id: 'hey yo'
            })

        getUDNReport.mockResolvedValue('i am a pdf')

        await expect(handler({
            detail: {
                loan: {
                    id: '123',
                    fields: {}
                }
            }
        }, {}, () => { })).resolves.not.toThrowError();
    });
});
