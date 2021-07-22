import get from 'lodash/get';
import qs from 'qs';
import { LoggerError } from '@revolutionmortgage/rm-logger';
import axios, { AxiosResponse, Method } from 'axios';
import { RM_CLIENT } from '../src/common/constants';

/**
 * Retrieves OAuth Bearer token from Encompass API
 * @returns {Promise<string>}
 */
const getToken = async (): Promise<string> => {
    const response = await axios({
        method: 'post',
        url: `${process.env.ENCOMPASS_API_BASE_URL}/oauth2/v1/token`,
        data: qs.stringify({
            grant_type: 'password',
            username: `${process.env.ENCOMPASS_SMART_CLIENT_USER}@encompass:${process.env.ENCOMPASS_INSTANCE}`,
            password: process.env.ENCOMPASS_SMART_CLIENT_PASSWORD,
            client_id: process.env.ENCOMPASS_CLIENT_ID,
            client_secret: process.env.ENCOMPASS_CLIENT_SECRET,
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-rm-client': RM_CLIENT,
            'x-api-key': process.env.ENCOMPASS_API_KEY,
        },
    });

    const token = get(response, 'data.access_token');
    return token;
}

const request = async (method: Method, url: string, data?: any) => {
    const token = await getToken();

    return await axios({
        method: method,
        url: `${process.env.ENCOMPASS_API_BASE_URL}${url}`,
        data,
        headers: {
            'x-rm-client': RM_CLIENT,
            'Authorization': `Bearer ${token}`,
            'x-api-key': process.env.ENCOMPASS_API_KEY,
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