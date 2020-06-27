class FollowError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FollowError';
    }
}

export default FollowError;
