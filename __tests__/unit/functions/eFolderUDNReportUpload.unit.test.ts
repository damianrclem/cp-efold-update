// @ts-nocheck
import { handler, InvalidParamsError } from '../../../src/functions/eFolderUDNReportUpload';
import { getLoan, getLoanDocuments, createLoanDocument } from "../../../src/clients/encompass";
import { getEncompassLoanBorrowerBySocialSecurityNumber } from "../../../src/helpers/getEncompassLoanBorrowerBySocialSecurityNumber";
import { getLoanDocumentByTitle } from "../../../src/helpers/getLoanDocumentByTitle";

jest.mock('../../../src/clients/encompass', () => ({
    getLoan: jest.fn(),
    getLoanDocuments: jest.fn(),
    createLoanDocument: jest.fn()
}))

jest.mock("../../../src/helpers/getEncompassLoanBorrowerBySocialSecurityNumber", () => ({
    getEncompassLoanBorrowerBySocialSecurityNumber: jest.fn()
}))

jest.mock("../../../src/helpers/getLoanDocumentByTitleAndBorrowerName", () => ({
    getLoanDocumentByTitleAndBorrowerName: jest.fn()
}))

jest.mock("../../../src/helpers/uploadUDNReportToEFolder", () => ({
    uploadUDNReportToEFolder: jest.fn()
}))

describe('eFolderUDNReportUpload', () => {
    test('it throws an InvalidParamsError if the loanId is not on the event request payload', async () => {
        const handlerWithNoLoanId = handler({}, {}, () => { });

        await expect(handlerWithNoLoanId).rejects.toThrow(InvalidParamsError);
        await expect(handlerWithNoLoanId).rejects.toThrow('LoanId missing on request payload');
    });

    test('it throws an InvalidParamsError if the loanId is not on the event request payload', async () => {
        const handlerWithNoSocialSecurityNumber = handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123'
                    }
                }
            }
        }, {}, () => { })

        await expect(handlerWithNoSocialSecurityNumber).rejects.toThrow(InvalidParamsError);
        await expect(handlerWithNoSocialSecurityNumber).rejects.toThrow('SocialSecurityNumber missing on request payload');
    });

    test('it throws an InvalidParamsError if the loanId is not on the event request payload', async () => {
        const handlerWithNoPdf = handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123',
                        SocialSecurityNumber: '123'
                    }
                }
            }
        }, {}, () => { })

        await expect(handlerWithNoPdf).rejects.toThrow(InvalidParamsError);
        await expect(handlerWithNoPdf).rejects.toThrow('pdf missing on response payload');
    });

    test('it does not throw an error if there is an existing loan document to upload to', async () => {
        getLoan.mockReturnValue(() => new Promise((resolve, reject) => {
            resolve({
                data: {}
            })
        }));

        getEncompassLoanBorrowerBySocialSecurityNumber.mockReturnValue({
            application: '123',
            fullName: 'bert',
        })

        getLoanDocuments.mockReturnValue(() => new Promise((resolve, reject) => {
            resolve({
                data: {}
            })
        }))

        getLoanDocumentByTitle.mockReturnValue({
            id: 'hey yo'
        })

        await expect(handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123',
                        SocialSecurityNumber: '123'
                    }
                },
                responsePayload: {
                    detail: {
                        pdf: 'i am a pdf'
                    }
                }
            }
        }, {}, () => { })).resolves.not.toThrowError();
    });

    test('it does not throw an error if there is NOT an existing loan document to upload to', async () => {
        getLoan.mockReturnValue(() => new Promise((resolve, reject) => {
            resolve({
                data: {}
            })
        }));

        getEncompassLoanBorrowerBySocialSecurityNumber.mockReturnValue({
            application: '123',
            fullName: 'bert',
        })

        getLoanDocuments.mockReturnValue(() => new Promise((resolve, reject) => {
            resolve({
                data: {}
            })
        }))

        createLoanDocument.mockReturnValue(() => new Promise((resolve, reject) => {
            resolve({
                data: {
                    id: '123'
                }
            })
        }))

        await expect(handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123',
                        SocialSecurityNumber: '123'
                    }
                },
                responsePayload: {
                    detail: {
                        pdf: 'i am a pdf'
                    }
                }
            }
        }, {}, () => { })).resolves.not.toThrowError();
    });
});
