import type { Request, Response } from "express";
import { prisma } from "../db";

export async function getUser(req: Request, res: Response) {
    const user = await prisma.user.findMany({
        where: {
            id: req.userId
        },
        select: {
            id: true,
            email: true,
            createdAt: true
        }
    });

    res.status(200).json({
        message: "User fetched",
        data: user
    });
}