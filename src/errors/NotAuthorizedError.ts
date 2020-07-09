/**
 * Throw this error when the user is not authorized to do a certain action.
 */
class NotAuthorizedError extends Error {
    /**
     * @constructor
     *
     * @param action The action that the user is not authorized to do. (Ex: 'delete {resource}')
     * */
    constructor(action: string) {
        super(`Not authorized to ${action}`);
        this.name = 'NotAuthorizedError';
    }
}

export default NotAuthorizedError;
