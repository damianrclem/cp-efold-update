// @ts-nocheck
import { handler, LoanDocumentForUDNReportsNotFoundError } from '../../../src/functions/eFolderUDNReportUpload';
import { InvalidEventParamsError } from '../../../src/common/errors';
import { getLoan, getLoanDocuments, createLoanDocument } from "../../../src/clients/encompass";
import { getEncompassLoanBorrowerBySocialSecurityNumber } from "../../../src/helpers/getEncompassLoanBorrowerBySocialSecurityNumber";
import { getLoanDocumentByTitle } from "../../../src/helpers/getLoanDocumentByTitle";
import { getUDNReport } from "../../../src/helpers/getUDNReport";
import { getItem } from '../../../src/common/database';
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
    test('it throws an InvalidEventParamsError if the loanId is not on the event detail payload', async () => {
        const handlerWithNoLoanId = handler({}, {}, () => { });

        await expect(handlerWithNoLoanId).rejects.toThrow(InvalidEventParamsError);
        await expect(handlerWithNoLoanId).rejects.toThrow('Required parameter detail.loan.id is missing on event payload');
    });

    test('it throws an InvalidEventParamsError if fields is not on the event detail payload', async () => {
        const handlerWithNoFields = handler({
            detail: {
                loan: {
                    id: '123'
                }
            }
        }, {}, () => { })

        await expect(handlerWithNoFields).rejects.toThrow(InvalidEventParamsError);
        await expect(handlerWithNoFields).rejects.toThrow('Required parameter detail.fields is missing on event payload');
    });

    test('it does not upload a udn report if no loan was found in the database', async () => {
        const response = await handler({
            detail: {
                loan: {
                    id: '123',
                },
                fields: {}
            }
        }, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: false,
        })
    });

    test('it does not upload a udn report if the loan audit fields have not changed', async () => {
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

        const response = await handler({
            detail: {
                loan: {
                    id: '123',
                },
                fields: fields
            }
        }, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: false,
        })
    })

    test('it uploads a udn report if there is an existing loan document to upload to', async () => {
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

        const response = await handler({
            detail: {
                loan: {
                    id: '123',
                },
                fields: {
                    [AUDIT_FIELDS[0]]: 'a value'
                }
            }
        }, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: true,
        })
    });

    test('it uploads a udn report if there is NOT an existing loan document to upload to', async () => {
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

        const response = await handler({
            detail: {
                loan: {
                    id: '123',
                },
                fields: {
                    [AUDIT_FIELDS[0]]: 'a value'
                }
            }
        }, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: true,
        })
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
                },
                fields: {
                    [AUDIT_FIELDS[0]]: 'a value'
                }
            }
        }, {}, () => { })).rejects.toThrow(LoanDocumentForUDNReportsNotFoundError);
    });

    test('it uploads a udn report if there is a Coborrower and an existing loan document to upload to', async () => {
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

        const response = await handler({
            detail: {
                loan: {
                    id: '123',
                },
                fields: {
                    [AUDIT_FIELDS[0]]: 'a value'
                }
            }
        }, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: true,
        })
    });

    test('it uploads a udn report if there is a Coborrower and NOT an existing loan document to upload to', async () => {
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

        const response = await handler({
            detail: {
                loan: {
                    id: '123',
                },
                fields: {
                    [AUDIT_FIELDS[0]]: 'a value'
                }
            }
        }, {}, () => { });

        expect(response).toEqual({
            udnReportUploaded: true,
        })
    });
});
