class PrivacyError extends Error {
    constructor(field: string) {
        super(`User's ${field} setting is set to private.`);
        this.name = 'PrivacyError';
    }
}

export default PrivacyError;
