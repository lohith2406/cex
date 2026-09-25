import { createOrderBodySchema, zodErrorMessage, type CreateOrderRequest, type EngineRequest } from "@repo/common";
import type { Request, Response } from "express";
import { sendToEngine } from "../engine-client";

export async function createOrder(req: Request, res: Response) {
    const parsed = createOrderBodySchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(411).json({ 
            message: "Invalid inputs",
            error: zodErrorMessage(parsed.error)
        });
        return;
    }

    const engineRequest: CreateOrderRequest = {
        ...parsed.data,
        type: "create_order",
        reqId: crypto.randomUUID(),
        userId: req.userId
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (!engineResponse) {
        res.status(504).json({ message: "Request timed out" })
        return;
    }

    if (engineResponse.type === "error") {
        res.status(404).json({ error: engineResponse.error });
        return;
    }

    res.status(201).json({ 
        message: "Order placed",
        data: engineResponse.data 
    });
}