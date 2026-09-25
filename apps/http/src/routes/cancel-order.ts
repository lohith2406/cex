import { cancelOrderParamsSchema, zodErrorMessage, type CancelOrderRequest } from "@repo/common";
import type { Request, Response } from "express";
import { sendToEngine } from "../engine-client";

export async function cancelOrder(req: Request, res: Response) {
    const parsed = cancelOrderParamsSchema.safeParse(req.params);

    if (!parsed.success) {
        res.status(411).json({
            message: "Invalid inputs",
            error: zodErrorMessage(parsed.error)
        });
        return;
    }

    const engineRequest: CancelOrderRequest = {
        type: "cancel_order",
        reqId: crypto.randomUUID(),
        userId: req.userId,
        orderId: parsed.data.orderId
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (!engineResponse) {
        res.status(504).json({ message: "Request timed out" });
        return;
    }

    if (engineResponse.type === "error") {
        res.status(400).json({ message: "Something went wrong" });
        return;
    }

    res.status(200).json({
        message: "Order cancelled",
        data: engineResponse.data
    });
}