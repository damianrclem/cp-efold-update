/**
 * Formats a string to an SSN format
 * @param {string} socialSecurityNumber - The social security number to format
 * @returns {string}
 */
export const formatAsSocialSecurityNumber = (socialSecurityNumber: string): string => {
    let formattedSSN: string = socialSecurityNumber.replace(/\D/g, '');
    formattedSSN = formattedSSN.replace(/^(\d{3})/, '$1-');
    formattedSSN = formattedSSN.replace(/-(\d{2})/, '-$1-');
    formattedSSN = formattedSSN.replace(/(\d)-(\d{4}).*/, '$1-$2');
    return formattedSSN;
}