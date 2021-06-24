import get from 'lodash/get';
import qs from 'qs';
import { LoggerError } from '@revolutionmortgage/rm-logger';
import axios from 'axios';

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

/**
 * Retrieves OAuth Bearer token from Encompass API
 * @returns {Promise<string>}
 */
export const getToken = async (): Promise<string> => {
    const baseUrl = get(process, 'env.ENCOMPASS_BASE_URL');
    if (!baseUrl) throw new EncompassClient_EnvironmentConfigurationError('Environment missing ENCOMPASS_BASE_URL');

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
            'x-rm-client': 'cp-efolder-upload',
        },
    });

    const token = get(response, 'data.access_token');
    if (!token) {
        throw new EncompassClient_MissingAuthTokenError('Invalid getToken response: missing access_token', response);
    }

    return token;
}