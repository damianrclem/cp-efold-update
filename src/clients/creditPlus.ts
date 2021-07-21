import { LoggerError } from "@revolutionmortgage/rm-logger";
import axios, { AxiosResponse } from "axios";
import { get } from "lodash";
import { RM_CLIENT, STAGE } from "../common/constants";

export class CreditPlusClient_EnvironmentConfigurationError extends LoggerError {
    constructor(message: string, data?: any) {
        super(message, data);
    }
}

/**
 * Gets the url for the credit plus api proxy
 * @returns {string} The url for the credit plus api proxy
 */
const getUrl = (): string => {
    const baseUrl = get(process, 'env.CREDIT_PLUS_API_BASE_URL');
    if (!baseUrl) throw new CreditPlusClient_EnvironmentConfigurationError('Environment missing CREDIT_PLUS_API_BASE_URL');

    return `${baseUrl}/inetapi/request_products.aspx`;
}

/**
 * Gets the api key for the credit plus api proxy
 * @return {string} The api key
 */
const getApiKey = (): string => {
    const apiKey = get(process, 'env.CREDIT_PLUS_API_KEY');
    if (!apiKey) throw new CreditPlusClient_EnvironmentConfigurationError('Environment missing CREDIT_PLUS_API_KEY');

    return apiKey as string;
}

/**
 * Create the credentials using the credit plus username/password
 * @returns {string} - The base64 encoded credentials
 */
const createCredentials = (): string => {
    const username = get(process, 'env.CREDIT_PLUS_API_USERNAME');
    if (!username) {
        throw new CreditPlusClient_EnvironmentConfigurationError('Environment variable missing CREDIT_PLUS_API_USERNAME');
    }

    const password = get(process, 'env.CREDIT_PLUS_API_PASSWORD');
    if (!password) {
        throw new CreditPlusClient_EnvironmentConfigurationError('Environment variable missing CREDIT_PLUS_API_PASSWORD');
    }

    return Buffer.from(`${username}:${password}`).toString('base64');
}

/**
 * Create the request headers needed for a credit plus request
 * @returns {Object} - The request headers
 */
const createRequestHeaders = (): {
    [key: string]: string
} => {
    const apiKey = getApiKey();
    const credentials = createCredentials();

    const headers = {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${credentials}`,
        'x-api-key': apiKey,
        'x-rm-client': RM_CLIENT
    }

    if (process.env.STAGE !== STAGE.PROD) {
        headers['MCL-Interface'] = 'SmartAPITestingIdentifier'
    }

    return headers;
}

interface GetUDNOrderParams {
    firstName: string
    lastName: string
    socialSecurityNumber: string
    vendorOrderIdentifier: string
}

/**
 * Get a UDN order
 * @param {GetUDNOrderParams} params - the data needed to get a udn order
 * @param {string} params.firstName The first name on the UDN order
 * @param {string} params.lastName The last name on the UDN order
 * @param {string} params.socialSecurityNumber The social security number on the UDN order
 * @param {string} params.vendorOrderIdentifier The UDN order id
 * @returns {Promise<AxiosResponse<any>>} the response from the api
 */
export const getUDNOrder = async (params: GetUDNOrderParams): Promise<AxiosResponse<any>> => {
    const url = getUrl();
    const headers = createRequestHeaders();
    const xmls = `<?xml version="1.0" encoding="utf-8"?>
<MESSAGE MessageType="Request" xmlns="http://www.mismo.org/residential/2009/schemas" xmlns:p2="http://www.w3.org/1999/xlink" xmlns:p3="inetapi/MISMO3_4_MCL_Extension.xsd">
	<ABOUT_VERSIONS>
		<ABOUT_VERSION>
			<DataVersionIdentifier>201703</DataVersionIdentifier>
		</ABOUT_VERSION>
	</ABOUT_VERSIONS>
	<DEAL_SETS>
		<DEAL_SET>
			<DEALS>
				<DEAL>
					<PARTIES>
						<!-- Declare the consumer -->
						<PARTY p2:label="Party1">
							<INDIVIDUAL>
								<NAME>
									<FirstName>${params.firstName}</FirstName>
									<LastName>${params.lastName}</LastName>
								</NAME>
							</INDIVIDUAL>
							<ROLES>
								<ROLE>
									<ROLE_DETAIL>
										<PartyRoleType>Borrower</PartyRoleType>
									</ROLE_DETAIL>
								</ROLE>
							</ROLES>
							<TAXPAYER_IDENTIFIERS>
								<TAXPAYER_IDENTIFIER>
									<TaxpayerIdentifierType>SocialSecurityNumber</TaxpayerIdentifierType>
									<TaxpayerIdentifierValue>${params.socialSecurityNumber}</TaxpayerIdentifierValue>
								</TAXPAYER_IDENTIFIER>
							</TAXPAYER_IDENTIFIERS>
						</PARTY>      			
					</PARTIES>
					<RELATIONSHIPS>
						<!-- Link the borrower to the service -->
						<RELATIONSHIP p2:arcrole="urn:fdc:Meridianlink.com:2017:mortgage/PARTY_IsVerifiedBy_SERVICE" p2:from="Party1" p2:to="Service1" />
					</RELATIONSHIPS>
					<SERVICES>
						<SERVICE p2:label="Service1">
							<CREDIT>
								<CREDIT_REQUEST>
									<CREDIT_REQUEST_DATAS>
										<CREDIT_REQUEST_DATA>
											<CREDIT_REQUEST_DATA_DETAIL>
												<CreditReportRequestActionType>Other</CreditReportRequestActionType>
												<CreditReportRequestActionTypeOtherDescription>Get</CreditReportRequestActionTypeOtherDescription>
											</CREDIT_REQUEST_DATA_DETAIL>
										</CREDIT_REQUEST_DATA>
									</CREDIT_REQUEST_DATAS>
								</CREDIT_REQUEST>
							</CREDIT>
							<SERVICE_PRODUCT>
								<SERVICE_PRODUCT_REQUEST>
									<SERVICE_PRODUCT_DETAIL>
										<ServiceProductDescription>UDN</ServiceProductDescription>
										<EXTENSION>
											<OTHER>
												<!-- Indicate the desired report formats -->
												<p3:SERVICE_PREFERRED_RESPONSE_FORMATS>
													<p3:SERVICE_PREFERRED_RESPONSE_FORMAT>
														<p3:SERVICE_PREFERRED_RESPONSE_FORMAT_DETAIL>
															<p3:PreferredResponseFormatType>Pdf</p3:PreferredResponseFormatType>
														</p3:SERVICE_PREFERRED_RESPONSE_FORMAT_DETAIL>
													</p3:SERVICE_PREFERRED_RESPONSE_FORMAT>
												</p3:SERVICE_PREFERRED_RESPONSE_FORMATS>
											</OTHER>
										</EXTENSION>
									</SERVICE_PRODUCT_DETAIL>
								</SERVICE_PRODUCT_REQUEST>
							</SERVICE_PRODUCT>
							<SERVICE_PRODUCT_FULFILLMENT>
								<SERVICE_PRODUCT_FULFILLMENT_DETAIL>
									<VendorOrderIdentifier>${params.vendorOrderIdentifier}</VendorOrderIdentifier>
								</SERVICE_PRODUCT_FULFILLMENT_DETAIL>
							</SERVICE_PRODUCT_FULFILLMENT>
						</SERVICE>
					</SERVICES>
				</DEAL>
			</DEALS>
		</DEAL_SET>
	</DEAL_SETS>
</MESSAGE>`;

    const response = await axios.post(url, xmls, headers);
    return response;
}


