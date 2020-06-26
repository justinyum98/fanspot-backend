import { sign, verify } from 'jsonwebtoken';

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
        throw error;
    }
    return decoded;
}
