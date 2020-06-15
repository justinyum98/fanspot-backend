const redis = require('./index');

/**
 * Converts the user document into an object, then caches that object.
 * DOES NOT POPULATE USER, should populate BEFORE calling this function.
 * Returns cached user object.
 * @param {UserDocument} userDoc - The user document that we are caching
 */
const cacheUser = async (userDoc) => {
    const userCache = JSON.stringify(userDoc.toJSON());
    return new Promise((resolve, reject) => {
        redis.set(userDoc._id.toString(), userCache, 'EX', 7200, (err, res) => {
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

const closeRedis = async () => {
    return new Promise((resolve, reject) => {
        redis.quit((err, res) => {
            if (err) reject(err);
            resolve(res);
        });
    });
};

module.exports = {
    cacheUser,
    getCachedUser,
    closeRedis,
};
