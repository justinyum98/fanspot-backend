class NotFoundException extends Error {

    constructor(entity) {
        super(`${entity} not found`);

        this._entity = entity;
    }
};

new NotFoundException('user');

try {

} catch (error) {

    if (error typeof NotFoundException) {
        // do someting
    }
}