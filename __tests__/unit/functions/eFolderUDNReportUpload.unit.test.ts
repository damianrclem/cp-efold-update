// @ts-nocheck
import { handler, InvalidParamsError } from '../../../src/functions/eFolderUDNReportUpload';

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
});
