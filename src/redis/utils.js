const redis = require('./index');

/**
 * Converts the user document into an object, then caches that object.
 * DOES NOT POPULATE USER, should populate BEFORE calling this function.
 * Returns cached user object.
 * @param {UserDocument} user - The user document that we are caching
 */
const cacheUser = async (user) => {
    const userCache = JSON.stringify(user.toJSON());
    return new Promise((resolve, reject) => {
        redis.set(user.id, userCache, 'EX', 7200, (err, res) => {
            if (err) reject(err);
            resolve(res);
        });
    });
};

const getCachedUser = async (userId) => {
    return new Promise((resolve, reject) => {
        redis.get(userId, (err, result) => {
            if (err) reject(err);
            resolve(JSON.parse(result));
        });
    });
};

module.exports = {
    cacheUser,
    getCachedUser,
};
