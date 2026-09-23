import jwt, { type JwtPayload } from "jsonwebtoken";

export function generateToken(userId: string, secret: string): string {
    const token = jwt.sign({ userId }, secret);
    return token;
}

export function verifyToken(token: string, secret: string): JwtPayload | null {
    try {
        return jwt.verify(token, secret) as JwtPayload; 
    } catch (err) {
        return null;
    }
}