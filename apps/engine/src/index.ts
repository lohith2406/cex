import { ENGINE_REPLIES, ENGINE_REQUESTS, engineRequestSchema, zodErrorMessage, type EngineReply } from "@repo/validation";
import { engineReplyQueue, engineRequestQueue } from "./redis";

for(;;) {
    const request = await engineRequestQueue.brPop(ENGINE_REQUESTS, 0);

    if (!request) {
        continue;
    }

    const parsedRequest = JSON.parse(request.element);

    const parsed = engineRequestSchema.safeParse(parsedRequest);

    if (!parsed.success) {
        console.error("client: bad request", zodErrorMessage(parsed.error));
        continue;
    }

    const data: EngineReply = { 
        reqId: parsed.data.reqId, 
        ok: true 
    }

    await sendToBackend(data)
}

export async function sendToBackend(response: EngineReply) {
    await engineReplyQueue.lPush(ENGINE_REPLIES, JSON.stringify(response));
}