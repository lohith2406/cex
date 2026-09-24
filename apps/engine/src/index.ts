import { ENGINE_REPLIES, ENGINE_REQUESTS, engineRequestSchema, zodErrorMessage, type AddBalanceReply, type CreateOrderReply, type EngineReply, type GetBalanceReply } from "@repo/common";
import { engineReplyQueue, engineRequestQueue } from "./redis";
import { OrderBook } from "./store/orderbook";
import { BalanceStore } from "./store/balance";

const orderbook = new OrderBook();
const balances = new BalanceStore();

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

        console.log("engine: received", parsed.data.type, parsed.data.reqId);

        if (parsed.data.type === "create_order") {
            const orderId = crypto.randomUUID();
            const order = { ...parsed.data, orderId };
            
            if (!balances.canAfford(order)) {
                await sendToBackend({ type: "error", reqId: order.reqId, error: "Insufficient balance" });
                continue;
            }
            
            balances.lock(order);
            const result = orderbook.placeOrder(order);

            for (const fill of result.fills ) {
                balances.settle(fill, order.price);
            }

            const remainingQty = result.order.qty - result.order.filledQty

            if (remainingQty > 0 && order.orderType === "MARKET") {
                balances.unlock(order, remainingQty);
            }

            const reply: CreateOrderReply = {
                type: "create_order", 
                reqId: parsed.data.reqId, 
                data: {
                    orderId,
                    filledQty: result.order.filledQty,
                    remainingQty,
                    status: result.order.status,
                    fills: result.fills
                } 
            };

            await sendToBackend(reply);

        } else if (parsed.data.type === "add_balance") {
            balances.deposit(parsed.data.userId, {
                asset: parsed.data.asset,
                amount: parsed.data.amount
            });

            const balance = balances.getOrCreateBalances(parsed.data.userId)[parsed.data.asset];

            const reply: AddBalanceReply = {
                type: "add_balance",
                reqId: parsed.data.reqId,
                data: {
                    asset: parsed.data.asset,
                    total: balance.total,
                    locked: balance.locked
                }
            }

            await sendToBackend(reply);

        } else if (parsed.data.type === "get_balance") {
            const userBalances = balances.getOrCreateBalances(parsed.data.userId);

            const reply: GetBalanceReply = {
                type: "get_balance",
                reqId: parsed.data.reqId,
                data: userBalances
            }

            await sendToBackend(reply);
        }
    }
}

engineRequestListener()

async function sendToBackend(response: EngineReply) {
    console.log("engine: replying", response.type, response.reqId);
    await engineReplyQueue.lPush(ENGINE_REPLIES, JSON.stringify(response));
}