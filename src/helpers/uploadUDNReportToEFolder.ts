import { createLoanAttachmentUrl, uploadAttachment } from "../clients/encompass"

/**
 * Uploads a base64 encoded pdf to an eFolder in Encompass
 * @param {string} loanId - The loan id
 * @param {string} loanDocumentId - The document id of the loan
 * @param {string} pdf - The base64 encoded pdf
 * @returns {Promise<void>}
 */
export const uploadUDNReportToEFolder = async (loanId: string, loanDocumentId: string, pdf: string): Promise<void> => {
    const file = Buffer.from(pdf, 'base64');
    const fileSize = Buffer.byteLength(file);

    const loanAttachementUrlResponse = await createLoanAttachmentUrl(loanId, loanDocumentId, fileSize, 'Credit Report');
    const { data } = loanAttachementUrlResponse;

    await uploadAttachment(data.uploadUrl, file);
}