import type { GetOpenOrdersRequest } from "@repo/common";
import type { Request, Response } from "express";
import { sendToEngine } from "../engine-client";

export async function getOpenOrders(req: Request, res: Response) {
    const engineRequest: GetOpenOrdersRequest = {
        type: "get_open_orders",
        reqId: crypto.randomUUID(),
        userId: req.userId
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (!engineResponse) {
        res.status(504).json({ error: "Request timed out" });
        return;
    };

    if (engineResponse.type === "error") {
        res.status(404).json({ error: engineResponse.error });
        return;
    }

    res.status(200).json({ 
        message: "Open orders fetched", 
        data: engineResponse.data 
    });
}