import type { Request, Response } from "express";
import { prisma } from "../db";
import { orderIdParamsSchema, zodErrorMessage } from "@repo/common";

export async function getOrder(req: Request, res: Response) {
    const parsed = orderIdParamsSchema.safeParse(req.params);

    if (!parsed.success) {
        res.status(411).json({
            message: "Invalid inputs",
            error: zodErrorMessage(parsed.error)
        });
        return;
    }
    
    const order = await prisma.order.findUnique({
        where: {
            id: parsed.data.orderId,
            userId: req.userId
        }
    });

    if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
    }

    res.status(200).json({
        message: "Order fetched",
        data: order
    });
}