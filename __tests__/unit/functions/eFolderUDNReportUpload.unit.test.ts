// @ts-nocheck
import { handler, InvalidParamsError, LoanDocumentForUDNReportsNotFoundError } from '../../../src/functions/eFolderUDNReportUpload';
import { getLoan, getLoanDocuments, createLoanDocument } from "../../../src/clients/encompass";
import { getEncompassLoanBorrowerBySocialSecurityNumber } from "../../../src/helpers/getEncompassLoanBorrowerBySocialSecurityNumber";
import { getLoanDocumentByTitle } from "../../../src/helpers/getLoanDocumentByTitle";
import { getUDNReport } from "../../../src/helpers/getUDNReport";
import { getItem, putItem } from '../../../src/common/database';

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
    test('it throws an InvalidParamsError if the loanId is not on the event request payload', async () => {
        const handlerWithNoLoanId = handler({}, {}, () => { });

        await expect(handlerWithNoLoanId).rejects.toThrow(InvalidParamsError);
        await expect(handlerWithNoLoanId).rejects.toThrow('loanId missing on request payload');
    });

    test('it throws an InvalidParamsError if vendorOrderIdentifier is not on the event response payload', async () => {
        const handleWithNoVenderOrderId = handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123'
                    }
                },
                responsePayload: {}
            }
        }, {}, () => { })

        await expect(handleWithNoVenderOrderId).rejects.toThrow(InvalidParamsError);
        await expect(handleWithNoVenderOrderId).rejects.toThrow('vendorOrderIdentifier missing on request payload');
    });

    test('it throws an InvalidParamsError if firstName is not on the event response payload', async () => {
        const handleWithNoFirstName = handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123'
                    }
                },
                responsePayload: {
                    vendorOrderIdentifier: 'blah'
                }
            }
        }, {}, () => { })

        await expect(handleWithNoFirstName).rejects.toThrow(InvalidParamsError);
        await expect(handleWithNoFirstName).rejects.toThrow('firstName missing on request payload');
    });

    test('it throws an InvalidParamsError if lastName is not on the event response payload', async () => {
        const handleWithNoLastName = handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123'
                    }
                },
                responsePayload: {
                    vendorOrderIdentifier: 'blah',
                    firstName: 'Berty'
                }
            }
        }, {}, () => { })

        await expect(handleWithNoLastName).rejects.toThrow(InvalidParamsError);
        await expect(handleWithNoLastName).rejects.toThrow('lastName missing on request payload');
    });

    test('it throws an InvalidParamsError if socialSecurityNumber is not on the event response payload', async () => {
        const handlerWithNoSocialSecurityNumber = handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123'
                    }
                },
                responsePayload: {
                    vendorOrderIdentifier: 'blah',
                    firstName: 'Berty',
                    lastName: 'McBertface'
                }
            }
        }, {}, () => { })

        await expect(handlerWithNoSocialSecurityNumber).rejects.toThrow(InvalidParamsError);
        await expect(handlerWithNoSocialSecurityNumber).rejects.toThrow('socialSecurityNumber missing on request payload');
    });

    test('it throws an InvalidParamsError if notificationsCount is not on the event response payload', async () => {
        const handlerWithNoNotificationsCount = handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123'
                    }
                },
                responsePayload: {
                    vendorOrderIdentifier: 'blah',
                    firstName: 'Berty',
                    lastName: 'McBertface',
                    socialSecurityNumber: '7'
                }
            }
        }, {}, () => { })

        await expect(handlerWithNoNotificationsCount).rejects.toThrow(InvalidParamsError);
        await expect(handlerWithNoNotificationsCount).rejects.toThrow('notificationsCount missing on request payload');
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

        getItem.mockReturnValue(() => new Promise((resolve) => {
            resolve({
                Item: {}
            })
        }));

        getUDNReport.mockReturnValue(() => new Promise((resolve, reject) => {
            resolve('I am a pdf')
        }))

        getLoanDocumentByTitle.mockReturnValue({
            id: 'hey yo'
        })

        await expect(handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123',
                    }
                },
                responsePayload: {
                    firstName: 'Lord',
                    lastName: 'McMuffin',
                    vendorOrderIdentifier: '23',
                    socialSecurityNumber: '123',
                    notificationsCount: 1
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
                data: ''
            })
        }))

        getItem.mockReturnValue(() => new Promise((resolve) => {
            resolve({
                Item: {}
            })
        }));

        getUDNReport.mockReturnValue(() => new Promise((resolve, reject) => {
            resolve('I am a pdf')
        }))

        await expect(handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123'
                    }
                },
                responsePayload: {
                    firstName: 'Lord',
                    lastName: 'McMuffin',
                    vendorOrderIdentifier: '23',
                    socialSecurityNumber: '123',
                    notificationsCount: 1
                }
            }
        }, {}, () => { })).resolves.not.toThrowError();
    });

    test('it does throw an error if no document was found to upload to', async () => {
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
                data: ''
            })
        }))

        getLoanDocumentByTitle.mockReturnValue(undefined);

        getItem.mockReturnValue(() => new Promise((resolve) => {
            resolve({
                Item: {}
            })
        }));

        getUDNReport.mockReturnValue(() => new Promise((resolve, reject) => {
            resolve('I am a pdf')
        }))

        await expect(handler({
            detail: {
                requestPayload: {
                    detail: {
                        LoanId: '123',
                    }
                },
                responsePayload: {
                    firstName: 'Lord',
                    lastName: 'McMuffin',
                    vendorOrderIdentifier: '23',
                    socialSecurityNumber: '123',
                    notificationsCount: 1
                }
            }
        }, {}, () => { })).rejects.toThrow(LoanDocumentForUDNReportsNotFoundError);
    });
});
