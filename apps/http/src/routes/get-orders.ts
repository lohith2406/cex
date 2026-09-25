import type { Request, Response } from "express";
import { prisma } from "../db";

export async function getOrders(req: Request, res: Response) {

    const orders = await prisma.order.findMany({
        where: {
            userId: req.userId
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    res.status(200).json({ 
        message: "Orders fetched",
        data: orders 
    });
}