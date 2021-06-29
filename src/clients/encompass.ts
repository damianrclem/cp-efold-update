import get from 'lodash/get';
import qs from 'qs';
import { LoggerError } from '@revolutionmortgage/rm-logger';
import axios, { AxiosResponse, Method } from 'axios';
import { UDN_REPORTS_E_FOLDER_DOCUMENT_DESCRIPTION, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE } from '../constants';

const RM_CLIENT = 'cp-efolder-upload';

export class EncompassClient_EnvironmentConfigurationError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}

export class EncompassClient_MissingAuthTokenError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}

const getBaseUrl = (): string => {
    const baseUrl = get(process, 'env.ENCOMPASS_API_BASE_URL');
    if (!baseUrl) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_API_BASE_URL');

    return baseUrl as string;
}

/**
 * Retrieves OAuth Bearer token from Encompass API
 * @returns {Promise<string>}
 */
const getToken = async (): Promise<string> => {
    const baseUrl = getBaseUrl();

    const smartClientUser = get(process, 'env.ENCOMPASS_SMART_CLIENT_USER');
    if (!smartClientUser) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_SMART_CLIENT_USER');

    const smartClientPassword = get(process, 'env.ENCOMPASS_SMART_CLIENT_PASSWORD');
    if (!smartClientPassword) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_SMART_CLIENT_PASSWORD');

    const clientId = get(process, 'env.ENCOMPASS_CLIENT_ID');
    if (!clientId) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_CLIENT_ID');

    const clientSecret = get(process, 'env.ENCOMPASS_CLIENT_SECRET');
    if (!clientSecret) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_CLIENT_SECRET');

    const response = await axios({
        method: 'post',
        url: `${baseUrl}/oauth2/v1/token`,
        data: qs.stringify({
            grant_type: 'password',
            username: `${smartClientUser}@encompass:be11207045`,
            password: smartClientPassword,
            client_id: clientId,
            client_secret: clientSecret,
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-rm-client': RM_CLIENT,
        },
    });

    const token = get(response, 'data.access_token');
    if (!token) {
        throw new EncompassClient_MissingAuthTokenError('Invalid getToken response: missing access_token', response);
    }

    return token;
}

/**
 * Makes a request to the Elliemae API with an access token
 * @param {Method} method - the request method
 * @param {string} endpoint - the endpoint to make a request against
 * @param {any} data - the request body
 * @returns {Promise<AxiosResponse<any>>}
 */
const callApi = async (
    method: Method,
    endpoint: string,
    data?: any
): Promise<AxiosResponse<any>> => {
    const token = await getToken();
    const baseUrl = getBaseUrl();

    const url = `${baseUrl}${endpoint}`;
    return await axios({
        method: method,
        url: url,
        data,
        headers: {
            'x-rm-client': RM_CLIENT,
            'Authorization': `Bearer ${token}`,
        }
    });
}

/**
 * Retrieves a loan from the API
 * @param {string} loanId - The id of the loan
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getLoan = async (loanId: string): Promise<AxiosResponse<any>> => {
    return await callApi('get', `/encompass/v3/loans/${loanId}`)
}

/**
 * Retrieves the loan's documents from the API
 * @param {string} loanId - The id of the loan
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getLoanDocuments = async (loanId: string): Promise<AxiosResponse<any>> => {
    return await callApi('get', `/encompass/v3/loans/${loanId}/documents`);
}

/**
 * Create a document on a loan
 * @param {string} loanId - The id of the loan
 * @param {string} applicationId - The application this document is tied to
 * @returns {Promise<AxiosResponse<any>>}
 */
export const createLoanDocument = async (loanId: string, applicationId: string): Promise<AxiosResponse<any>> => {
    return await callApi('patch', `/encompass/v3/loans/${loanId}/documents?action=add`, {
        title: UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE,
        description: UDN_REPORTS_E_FOLDER_DOCUMENT_DESCRIPTION,
        application: {
            entityId: applicationId,
            entityType: "Applicant"
        }
    });
}

/**
 * Create a URL to upload an attach to a loan and a loan's document
 * @param {string} loanId - The id of the loan
 * @param {string} loanDocumentId - The id of the loan document
 * @returns {Promise<AxiosResponse<any>>}
 */
export const createLoanAttachmentUrl = async (loanId: string, loanDocumentId: string): Promise<AxiosResponse<any>> => {
    return await callApi('post', `/encompass/v3/loans/${loanId}/attachmentUploadUrl`, {
        assignTo: {
            entityId: loanDocumentId,
            entityType: 'Document'
        },
        file: {
            contentType: 'application/pdf',
            name: 'report.pdf' // TODO: find out if this name is appropriate
        },
    });
}

/**
 * Upload an attachment using a url
 * @param {string} uploadAttachmentUrl - The url to upload an attachment file. This can be created using the `createLoanAttachmentUrl` function.
 * @param {Buffer} file - The file you want to upload
 * @returns {Promise<AxiosResponse<any>>}
 */
export const uploadAttachment = async (uploadAttachmentUrl: string, file: Buffer): Promise<AxiosResponse<any>> => {
    const token = getToken();

    return await axios.put(uploadAttachmentUrl, file, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}