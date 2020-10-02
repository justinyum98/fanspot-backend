import { sign, verify } from 'jsonwebtoken';
import NotAuthenticatedError from '../errors/NotAuthenticatedError';

export function generateJWT(id: string, username: string): string {
    return sign(
        {
            id,
            username,
        },
        process.env.JWT_SECRET,
        {
            issuer: 'Fanspot',
            expiresIn: '2h',
        },
    );
}

export function verifyJWT(token: string): any {
    let decoded;
    try {
        decoded = verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new NotAuthenticatedError(error.message);
    }
    return decoded;
}
