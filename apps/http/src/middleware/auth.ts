import { verifyToken } from "@repo/auth";
import type { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "../env";

export function auth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const payload = verifyToken(token, JWT_SECRET);
    
    if (!payload) {
        res.status(401).json({ error: "Unauthorized"});
        return;
    }
    
    req.userId = payload.userId;
    next();
}