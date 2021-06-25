import { createLoanAttachmentUrl, uploadAttachment } from "../clients/encompass"

export const uploadUDNReportToEFolder = async (loanId: string, loanDocumentId: string, pdf: string): Promise<void> => {
    const loanAttachementUrlResponse = await createLoanAttachmentUrl(loanId, loanDocumentId);
    const { data } = loanAttachementUrlResponse;

    const file = Buffer.from(pdf, 'base64')
    await uploadAttachment(data.uploadUrl, file);
}