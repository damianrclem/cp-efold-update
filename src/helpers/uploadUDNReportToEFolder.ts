import { createLoanAttachmentUrl, uploadAttachment } from "../clients/encompass"

export const uploadUDNReportToEFolder = async (loanId: string, loanDocumentId: string, pdf: string): Promise<void> => {
    const file = Buffer.from(pdf, 'base64');
    const fileSize = Buffer.byteLength(file);

    const loanAttachementUrlResponse = await createLoanAttachmentUrl(loanId, loanDocumentId, fileSize, 'Credit Report');
    const { data } = loanAttachementUrlResponse;

    await uploadAttachment(data.uploadUrl, file);
}