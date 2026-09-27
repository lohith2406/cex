import type { Request, Response } from "express";
import { prisma } from "../db";
import { getTradesQuerySchema, zodErrorMessage } from "@repo/common";

export async function getTrades(req: Request, res: Response) {
    const parsed = getTradesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        res.status(400).json({
            message: "Invalid inputs",
            error: zodErrorMessage(parsed.error)
        });
        return;
    }

    const trades = await prisma.fill.findMany({
        where: {
            market: parsed.data.market
        },
        orderBy: {
            createdAt: "desc"
        },
        take: parsed.data.limit,
        select: {
            price: true,
            qty: true,
            takerSide: true,
            createdAt: true
        }
    });

    res.status(200).json({
        message: "trades fetched",
        data: trades
    });
}