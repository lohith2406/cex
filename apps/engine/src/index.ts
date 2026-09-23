import { ENGINE_REPLIES, ENGINE_REQUESTS, engineRequestSchema, zodErrorMessage, type EngineReply } from "@repo/common";
import { engineReplyQueue, engineRequestQueue } from "./redis";
import { OrderBook } from "./store/orderbook";

const orderbook = new OrderBook();

async function engineRequestListener() {
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

        if (parsed.data.type === "create_order") {
            const orderId = crypto.randomUUID();
            const result = orderbook.placeOrder({ ...parsed.data, orderId });
    
            const reply: EngineReply = { 
                reqId: parsed.data.reqId, 
                ok: true,
                data: {
                    orderId,
                    filledQty: result.filledQty,
                    remainingQty: result.remainingQty,
                    status: result.status,
                    fills: result.fills
                } 
            };

            await sendToBackend(reply)
        } else if (parsed.data.type === "add_balance") {
            
        }
    }
}

engineRequestListener()

async function sendToBackend(response: EngineReply) {
    await engineReplyQueue.lPush(ENGINE_REPLIES, JSON.stringify(response));
}