import { generateToken } from "@repo/auth";
import { prisma } from "../db";
import { authSchema, zodErrorMessage } from "@repo/common";
import type { Request, Response } from "express";
import { JWT_SECRET } from "../env";
import bcrypt from "bcrypt";

export async function signin(req: Request, res: Response) {
    const parsed = authSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(411).json({ 
            message: "Invalid inputs",
            error: zodErrorMessage(parsed.error) 
        });
        return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
    }

    res.status(200).json({
        message: "Signed in successfully",
        token: generateToken(user.id, JWT_SECRET)
    })
}