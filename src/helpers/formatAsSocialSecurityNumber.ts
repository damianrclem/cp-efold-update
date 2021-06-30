/**
 * Formats a string to an SSN format
 * @param {string} socialSecurityNumber - The social security number to format
 * @returns {string}
 */
export const formatAsSocialSecurityNumber = (socialSecurityNumber: string): string => socialSecurityNumber.replace(/(\d{3})(\d{2})(\d{4})/g, '$1-$2-$3');
