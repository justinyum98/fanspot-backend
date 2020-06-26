class NotFoundError extends Error {
    constructor(entity: string) {
        super(`${entity} could not be found.`);
        this.name = 'NotFoundError';
    }
}

export default NotFoundError;
