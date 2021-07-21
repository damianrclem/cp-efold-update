import { xml2json } from "xml-js";
import jsonpath from 'jsonpath';
import { getUDNOrder } from "../clients/creditPlus";
import { LoggerError } from '@revolutionmortgage/rm-logger';

export class PDFReportNotFoundError extends LoggerError {
    constructor(udnOrderId: string, data?: any) {
        super(`No PDF report found for UDN Order ID: ${udnOrderId}`, data)
    }
}

interface GetUDNReportParams {
    firstName: string;
    lastName: string;
    socialSecurityNumber: string;
    vendorOrderIdentifier: string;
}

/**
 * @param {GetUDNReportParams} params The parameters needed to get the UDN report
 * @param {string} params.firstName The first name on the UDN order
 * @param {string} params.lastName The last name on the UDN order
 * @param {string} params.socialSecurityNumber The social security number on the UDN order
 * @param {string} params.vendorOrderIdentifier The UDN order id
 * @returns {Promise<string>} - The base64 encdoed pdf udn report
 */
export const getUDNReport = async (params: GetUDNReportParams): Promise<string> => {
    const response = await getUDNOrder(params);
    const parsedResponseAsJson = JSON.parse(xml2json(response.data, { compact: true }));

    const pdf = jsonpath.query(parsedResponseAsJson, '$..EmbeddedContentXML._text')[0] ?? null;

    if (!pdf) {
        throw new PDFReportNotFoundError(params.vendorOrderIdentifier, parsedResponseAsJson);
    }

    return pdf;
}