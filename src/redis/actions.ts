import { UserDocument, UserJSON } from '../database/models/UserModel';
import { redis } from '.';

export async function cacheUser(userDoc: UserDocument): Promise<'OK'> {
    const userCache = JSON.stringify(userDoc.toJSON());
    return new Promise((resolve, reject) => {
        redis.set(userDoc._id.toString(), userCache, 'EX', 7200, (err, res) => {
            if (err) return reject(err);
            return resolve(res);
        });
    });
}

export async function getCachedUser(userId: string): Promise<UserJSON> {
    return new Promise((resolve, reject) => {
        redis.get(userId, (err, result) => {
            if (err) return reject(err);
            return resolve(JSON.parse(result));
        });
    });
}

export async function closeRedis(): Promise<'OK'> {
    return new Promise((resolve, reject) => {
        redis.quit((err, res) => {
            if (err) return reject(err);
            return resolve(res);
        });
    });
}
