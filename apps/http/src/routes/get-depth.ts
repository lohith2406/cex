import { marketParamsSchema, zodErrorMessage, type GetDepthRequest } from "@repo/common";
import type { Request, Response } from "express";
import { sendToEngine } from "../engine-client";

export async function getDepth(req: Request, res: Response) {
    const parsed = marketParamsSchema.safeParse(req.params);

    if (!parsed.success) {
        res.status(411).json({
            message: "Invalid inputs",
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
        res.status(504).json({ message: "Request timed out" });
        return;
    };

    if (engineResponse.type === "error") {
        res.status(404).json({ message: "Something went wrong" });
        return;
    }

    res.status(200).json({ 
        message: "Depth fetched", 
        data: engineResponse.data 
    });
}