import { addBalanceBodySchema, zodErrorMessage, type AddBalanceReply, type AddBalanceRequest, type EngineRequest, type ErrorReply } from "@repo/common";
import type { Request, Response } from "express";
import { sendToEngine } from "../engine-client";

export async function addBalance(req: Request, res: Response) {
    const parsed = addBalanceBodySchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(411).json({
            message: "Invalid inputs",
            error: zodErrorMessage(parsed.error)
        });
        return;
    }

    const engineRequest: AddBalanceRequest = {
        ...parsed.data,
        type: "add_balance",
        reqId: crypto.randomUUID(),
        userId: req.userId
    };

    const engineResponse = await sendToEngine(engineRequest);

    if (!engineResponse) {
        res.status(504).json({ message: "Request timed out" })
        return;
    }

    if (engineResponse.type === "error") {
        res.status(400).json({ error: engineResponse.error });
        return
    }

    res.status(200).json({
        message: "Balance updated",
        data: engineResponse.data
    })
}