import get from 'lodash/get';
import qs from 'qs';
import { LoggerError } from '@revolutionmortgage/rm-logger';
import axios, { AxiosResponse, Method } from 'axios';
import { RM_CLIENT } from '../../src/common/constants';

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

const request = async (method: Method, url: string, data?: any) => {
    const token = await getToken();
    const baseUrl = getBaseUrl();
    const apiKey = getApiKey();

    return await axios({
        method: method,
        url: `${baseUrl}${url}`,
        data,
        headers: {
            'x-rm-client': RM_CLIENT,
            'Authorization': `Bearer ${token}`,
            'x-api-key': apiKey,
        }
    });
}

export const createLoan = async (borrowerData?: { [key: string]: any}): Promise<AxiosResponse<any>> => {
    return await request("POST", "/encompass/v3/loans?loanFolder=Testing&view=id", {
            applications: [
                {
                    borrower: {
                        FirstName: new Date().toDateString(),
                        LastName: 'Integration Test',
                        ...borrowerData
                    },
                },
            ]
        })
}

export const deleteLoan = async (loanId: string): Promise<AxiosResponse<any>> => {
    return await request("DELETE", `/encompass/v3/loans/${loanId}`)
}