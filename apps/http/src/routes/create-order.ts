import { createOrderBodySchema, zodErrorMessage, type EngineReply, type EngineRequest } from "@repo/validation";
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

    const engineRequest: EngineRequest = {
        ...parsed.data,
        reqId: crypto.randomUUID(),
        userId: req.userId
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (!engineResponse) {
        res.status(504).json({ message: "Something went wrong" })
        return;
    }

    if (!engineResponse.ok) {
        res.status(400).json({ 
            message: "Something went wrong",
            error: engineResponse.error
        });
        return;
    }

    res.status(201).json({ message: "Order placed" });
}