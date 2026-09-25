import { zodErrorMessage, type GetBalanceRequest } from "@repo/common";
import type { Request, Response } from "express";
import { sendToEngine } from "../engine-client";

export async function getBalances(req: Request, res: Response) {

    const engineRequest: GetBalanceRequest = {
        type: "get_balance",
        reqId: crypto.randomUUID(),
        userId: req.userId,
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (!engineResponse) {
        res.status(504).json({ message: "Request timed out" })
        return;
    }

    if (engineResponse.type === "error") {
        res.status(404).json({ error: engineResponse.error });
        return
    }

    res.status(200).json({ 
        message: "Balance fetched",
        data: engineResponse.data 
    });
}