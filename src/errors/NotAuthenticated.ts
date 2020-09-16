class NotAuthenticated extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotAuthenticated';
    }
}

export default NotAuthenticated;
