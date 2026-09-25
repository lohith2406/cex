import type { Request, Response } from "express";
import { prisma } from "../db";

export async function getFills(req: Request, res: Response) {
    const fills = await prisma.fill.findMany({
        where: {
            OR: [{
                makerId: req.userId
            }, {
                takerId: req.userId
            }]
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    res.status(200).json({
        message: "Fills fetched",
        data: fills
    });
}