import { prisma } from "../db";
import { authSchema, zodErrorMessage } from "@repo/common";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";

export async function signup(req: Request, res: Response) {
    const parsed = authSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ 
            error: zodErrorMessage(parsed.error)
        });
        return;
    }

    const { email, password } = parsed.data;

    const existingUser = await prisma.user.findFirst({
        where: { email }
    });

    if (existingUser) {
        res.status(409).json({ error: "User already exists" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            email,
            password: hashedPassword
        }
    });

    res.status(201).json({ message: "Signed up successfully" });
}