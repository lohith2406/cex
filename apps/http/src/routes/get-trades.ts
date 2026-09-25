import type { Request, Response } from "express";
import { prisma } from "../db";

export async function getTrades(req: Request, res: Response) {
    const trades = await prisma.fill.findMany({
        orderBy: {
            createdAt: "desc"
        },
        take: 50
    });

    res.status(200).json({
        message: "trades fetched",
        data: trades
    });
}