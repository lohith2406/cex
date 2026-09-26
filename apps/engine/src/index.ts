import { depthChannel, ENGINE_EVENTS, ENGINE_REPLIES, ENGINE_REQUESTS, engineRequestSchema, tradeChannel, zodErrorMessage, type AddBalanceReply, type CancelOrderReply, type CreateOrderReply, type EngineReply, type GetBalanceReply, type GetDepthReply, type OrderCancelledMessage, type OrderResultMessage } from "@repo/common";
import { reader, writer } from "./redis";
import { OrderBook } from "./store/orderbook";
import { BalanceStore } from "./store/balance";
import { load, save, SNAPSHOT_PATH } from "./snapshot";

const orderbook = new OrderBook();
const balances = new BalanceStore();

const snapshot = await load(SNAPSHOT_PATH);
if (snapshot) {
    orderbook.loadSnapshot(snapshot.orderbook);
    balances.loadSnapshot(snapshot.balances);
}

setInterval(async () => {
    try {
        await save(SNAPSHOT_PATH, {
            orderbook: orderbook.saveSnapshot(),
            balances: balances.saveSnapshot()
        });
    } catch (err) {
        console.error("snapshot failed", err);
    }
}, 5000)

async function readerListener() {
    for(;;) {
        const request = await reader.brPop(ENGINE_REQUESTS, 0);

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

            for (const fill of result.fills) {
                await writer.publish(tradeChannel(fill.market), 
                JSON.stringify({
                    price: fill.price, 
                    qty: fill.qty, 
                    takerSide: fill.takerSide, 
                    ts: Date.now()
                }));
            }

            await writer.publish(depthChannel(order.market), 
                JSON.stringify(orderbook.depth(order.market))
            );

            const dbMessage: OrderResultMessage = {
                type: "order_result",
                order: result.order,
                makerOrders: result.makerOrders,
                fills: result.fills
            }

            await writer.xAdd(ENGINE_EVENTS, "*", { data: JSON.stringify(dbMessage) });
            
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

        } else if (parsed.data.type === "cancel_order") {
            const order = orderbook.cancelOrder(parsed.data.orderId, parsed.data.userId);

            if (!order) {
                await sendToBackend({
                    type: "error",
                    reqId: parsed.data.reqId,
                    error: "Order not found or not cancellable"
                });
                continue;
            }

            balances.unlock(order, order.qty - order.filledQty);

            const reply: CancelOrderReply = {
                type: "cancel_order",
                reqId: parsed.data.reqId,
                data: { order }
            };

            await sendToBackend(reply);

            await writer.publish(depthChannel(order.market),
                JSON.stringify(orderbook.depth(order.market))
            );

            const message: OrderCancelledMessage = {
                type: "order_cancelled",
                order
            };
            await writer.xAdd(ENGINE_EVENTS, "*", { data: JSON.stringify(message) });
        } else if (parsed.data.type === "get_depth") {
            const reply: GetDepthReply = {
                type: "get_depth",
                reqId: parsed.data.reqId,
                data: orderbook.depth(parsed.data.market)
            }

            await sendToBackend(reply);
        }
    }
}

readerListener()

async function sendToBackend(response: EngineReply) {
    console.log("engine: replying", response.type, response.reqId);
    await writer.lPush(ENGINE_REPLIES, JSON.stringify(response));
}