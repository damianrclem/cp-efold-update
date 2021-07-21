// @ts-nocheck
import { getUDNReport, PDFReportNotFoundError } from '../../../src/helpers/getUDNReport';
import { getUDNOrder } from "../../../src/clients/creditPlus";

jest.mock('../../../src/clients/creditPlus', () => ({
    getUDNOrder: jest.fn()
}))

describe('getUDNReport', () => {
    test('throws a PDFReportNotFoundError when no pdf report is found on the order', async () => {
        getUDNOrder.mockResolvedValue({
            data: '<greeting>Hello, World!</greeting>'
        });

        await expect(getUDNReport({
            firstName: 'Bertty',
            lastName: 'Bert Bert',
            vendorOrderIdentifier: '123',
            socialSecurityNumber: '123?'
        })).rejects.toThrowError(PDFReportNotFoundError);
    });
});
