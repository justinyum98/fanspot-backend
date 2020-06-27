import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function generatePasswordHash(password: string): Promise<string> {
    const hash: string = await bcrypt.hash(password, saltRounds);
    return hash;
}

export async function validatePasswordMatch(providedPassword: string, passwordHash: string): Promise<boolean> {
    const match: boolean = await bcrypt.compare(providedPassword, passwordHash);
    if (!match) return false;
    return true;
}
