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

export async function verifyJWT(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
        verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
        });
    });
}
