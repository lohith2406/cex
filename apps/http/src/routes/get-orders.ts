import type { Request, Response } from "express";
import { prisma } from "../db";
import type { Order } from "@repo/common";

export async function getOrders(req: Request, res: Response) {

    const rows = await prisma.order.findMany({
        where: {
            userId: req.userId,
            status: {
                notIn: ["OPEN", "PARTIALLY_FILLED"]
            }
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 50
    });

    const orders: Order[] = rows.map((row) => ({
        orderId: row.id,
        userId: row.userId,
        market: row.market,
        side: row.side,
        orderType: row.type,
        price: row.price,
        qty: row.qty,
        filledQty: row.filledQty,
        status: row.status,
        createdAt: row.createdAt.getTime()
    }));

    res.status(200).json({ 
        message: "Orders fetched",
        data: orders 
    });
}