import { ENGINE_REPLIES, ENGINE_REQUESTS, engineReplySchema, zodErrorMessage, type EngineReply, type EngineRequest } from "@repo/validation";
import { engineRequestQueue, engineReplyQueue } from "./redis";

let pendingEngineReplies: Map<string, (reply: EngineReply) => void> = new Map();

export async function sendToEngine(request: EngineRequest) {    
    const promise = new Promise<EngineReply | null>((resolve) => {
        const timer = setTimeout(() => {
            pendingEngineReplies.delete(request.reqId);
            resolve(null);
        }, 5000)
        pendingEngineReplies.set(request.reqId, (reply) => {
            clearTimeout(timer);
            resolve(reply);
        })
    })

    await engineRequestQueue.lPush(ENGINE_REQUESTS, JSON.stringify(request));

    return promise;
};

async function EngineReplyListener() {
    for(;;) {
        const reply = await engineReplyQueue.brPop(ENGINE_REPLIES, 0);
        
        if(!reply) {
            continue;
        }

        const parsedReply = JSON.parse(reply.element);

        const parsed = engineReplySchema.safeParse(parsedReply);

        if (!parsed.success) {
            console.error("engine: bad message", zodErrorMessage(parsed.error))
            continue;
        }

        if (pendingEngineReplies.has(parsed.data.reqId)) {
            const fn = pendingEngineReplies.get(parsed.data.reqId);
            if (fn) {
                fn(parsed.data);
            }
            pendingEngineReplies.delete(parsed.data.reqId);
        }
    }
};

EngineReplyListener();