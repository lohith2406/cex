import { marketQuerySchema, zodErrorMessage, type GetDepthRequest } from "@repo/common";
import type { Request, Response } from "express";
import { sendToEngine } from "../engine-client";

export async function getDepth(req: Request, res: Response) {
    const parsed = marketQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        res.status(400).json({
            error: zodErrorMessage(parsed.error)
        });
        return;
    }

    const engineRequest: GetDepthRequest = {
        type: "get_depth",
        reqId: crypto.randomUUID(),
        market: parsed.data.market
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
        message: "Depth fetched", 
        data: engineResponse.data 
    });
}