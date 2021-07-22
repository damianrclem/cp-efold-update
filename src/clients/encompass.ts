import get from 'lodash/get';
import qs from 'qs';
import { LoggerError } from '@revolutionmortgage/rm-logger';
import axios, { AxiosResponse, Method } from 'axios';
import { RM_CLIENT, UDN_REPORTS_E_FOLDER_DOCUMENT_DESCRIPTION, UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE } from '../common/constants';

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

const getApiKey = (): string => {
    const apiKey = get(process, 'env.ENCOMPASS_API_KEY');
    if (!apiKey) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_API_KEY');

    return apiKey as string;
}

/**
 * Retrieves OAuth Bearer token from Encompass API
 * @returns {Promise<string>}
 */
const getToken = async (): Promise<string> => {
    const baseUrl = getBaseUrl();
    const apiKey = getApiKey();

    const smartClientUser = get(process, 'env.ENCOMPASS_SMART_CLIENT_USER');
    if (!smartClientUser) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_SMART_CLIENT_USER');

    const smartClientPassword = get(process, 'env.ENCOMPASS_SMART_CLIENT_PASSWORD');
    if (!smartClientPassword) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_SMART_CLIENT_PASSWORD');

    const clientId = get(process, 'env.ENCOMPASS_CLIENT_ID');
    if (!clientId) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_CLIENT_ID');

    const clientSecret = get(process, 'env.ENCOMPASS_CLIENT_SECRET');
    if (!clientSecret) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_CLIENT_SECRET');

    const instance = get(process, 'env.ENCOMPASS_INSTANCE');
    if (!instance) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_INSTANCE');

    const response = await axios({
        method: 'post',
        url: `${baseUrl}/oauth2/v1/token`,
        data: qs.stringify({
            grant_type: 'password',
            username: `${smartClientUser}@encompass:${instance}`,
            password: smartClientPassword,
            client_id: clientId,
            client_secret: clientSecret,
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-rm-client': RM_CLIENT,
            'x-api-key': apiKey,
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
    const apiKey = getApiKey();

    const url = `${baseUrl}${endpoint}`;
    return await axios({
        method: method,
        url: url,
        data,
        headers: {
            'x-rm-client': RM_CLIENT,
            'Authorization': `Bearer ${token}`,
            'x-api-key': apiKey,
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
    return await callApi('patch', `/encompass/v3/loans/${loanId}/documents?action=add`, [{
        title: UDN_REPORTS_E_FOLDER_DOCUMENT_TITLE,
        description: UDN_REPORTS_E_FOLDER_DOCUMENT_DESCRIPTION,
        application: {
            entityId: applicationId,
            entityType: "Application"
        }
    }]);
}

/**
 * Create a URL to upload an attach to a loan and a loan's document
 * @param {string} loanId - The id of the loan
 * @param {string} loanDocumentId - The id of the loan document
 * @param {number} fileSize - The fize of the file attachment
 * @param {string} title - The title of the attachment
 * @returns {Promise<AxiosResponse<any>>}
 */
export const createLoanAttachmentUrl = async (loanId: string, loanDocumentId: string, fileSize: number, title: string): Promise<AxiosResponse<any>> => {
    return await callApi('post', `/encompass/v3/loans/${loanId}/attachmentUploadUrl`, {
        title,
        assignTo: {
            entityId: loanDocumentId,
            entityType: 'Document'
        },
        file: {
            size: fileSize,
            contentType: 'application/pdf',
            name: `${title}.pdf`
        },
    });
}

/**
 * Upload an attachment using a url
 * @param {string} uploadAttachmentUrl - The url to upload an attachment file. This can be created using the `createLoanAttachmentUrl` function.
 * @param {Buffer} file - The file you want to upload
 * @returns {Promise<AxiosResponse<any>>}
 */
export const uploadAttachment = async (uploadAttachmentUrl: string, file: Buffer, authorizationHeader?: string): Promise<AxiosResponse<any>> => {
    let authorizationValue: string;
    if (authorizationHeader) {
        authorizationValue = authorizationHeader;
    } else {
        const token = await getToken();
        authorizationValue = `Bearer ${token}`;
    }

    return await axios.put(uploadAttachmentUrl, file, {
        headers: {
            'Authorization': authorizationValue,
            'Content-Type': "application/pdf"
        }
    });
}

/**
 * Creates a loan
 * @param {Object} params - The params needed to created the loan
 * @param {string} params.loanFolder - The name of the folder to create the loan in
 * @param {Object[]} params.applications - The applications on the loan
 * @param {Object} params.applications[].borrower - The borrower on the application
 * @param {string} params.applications[].borrower.FirstName - The first name of the borrower
 * @param {string} params.applications[].borrower.LastName - The last name of the borrower
 * @param {string} params.applications[].borrower.TaxIdentificationNumber - The tax id of the borrower (IE, an SSN)
 * @returns {Promise<AxiosResponse<any>>} The create loan response
 */
export const createLoan = async (params: {
    loanFolder: string
    applications: Array<{
        borrower: {
            FirstName: string
            LastName: string
            TaxIdentificationNumber: string
        }
    }>
}): Promise<AxiosResponse<any>> => {
    return await callApi('post', `/encompass/v3/loans?loanFolder=${params.loanFolder}&view=id`, params.applications);
}

/**
 * Deletes a loan
 * @param {string} loanId - The id of the loan
 * @returns {Promise<AxiosResponse<any>>} The delete loan response
 */
export const deleteLoan = async (loanId: string): Promise<AxiosResponse<any>> => {
    return await callApi('delete', `/encompass/v3/loans/${loanId}`)
}