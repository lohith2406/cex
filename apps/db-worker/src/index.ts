import { DB_WORKER_GROUP, dbMessageSchema, ENGINE_EVENTS, zodErrorMessage } from "@repo/common"
import { reader, writer } from "./redis"
import { prisma } from "./db";

const CONSUMER = `db-worker-${crypto.randomUUID()}`;

type StreamEntry = {
    id: string;
    message: { data: string }
};

type StreamReply = {
    name: string;
    messages: StreamEntry[]
}[] | null;

async function createGroup() {
    try {
        await reader.xGroupCreate(ENGINE_EVENTS, DB_WORKER_GROUP, "0", { MKSTREAM: true });
    } catch (err) {
        if (!String(err).includes("BUSYGROUP")) {
            throw err;
        }
    }
}

async function reclaimStranded() {
    let cursor = "0-0"; // start cursor from timestamp 0, sequence 0 (lowest id possible)
    for (;;) {
        const request = await writer.xAutoClaim(ENGINE_EVENTS, DB_WORKER_GROUP, CONSUMER, 60000, cursor);
        for (const message of request.messages) {
            if (!message) {
                continue;
            }
            if (!message.message.data) {
                continue;
            }
            await handleMessage(message.message.data);
            await writer.xAck(ENGINE_EVENTS, DB_WORKER_GROUP, message.id);
        }

        if (String(request.nextId) === "0-0") { // all stranded requests covered
            break;
        }
        cursor = String(request.nextId);
    }
}

async function handleMessage(message: string) {
    const parsedRequest = JSON.parse(message);
    const parsed = dbMessageSchema.safeParse(parsedRequest);

    if (!parsed.success) {
        console.error("db-worker: bad message", zodErrorMessage(parsed.error));
        return;
    }

    if (parsed.data.type === "order_result") {
        const { order, makerOrders, fills } = parsed.data;
        const affectedOrders = [order, ...makerOrders];
    
        await prisma.$transaction(async (tx) => {
            for (const affectedOrder of affectedOrders) {
                await tx.order.upsert({
                    where: {
                        id: affectedOrder.orderId
                    },
                    update: {
                        filledQty: affectedOrder.filledQty,
                        status: affectedOrder.status,
                    },
                    create: {
                        id: affectedOrder.orderId,
                        userId: affectedOrder.userId,
                        market: affectedOrder.market,
                        price: affectedOrder.price,
                        qty: affectedOrder.qty,
                        filledQty: affectedOrder.filledQty,
                        side: affectedOrder.side,
                        type: affectedOrder.orderType,
                        status: affectedOrder.status,
                        createdAt: new Date(affectedOrder.createdAt)
                    }
                });
            }
    
            for (const fill of fills) {
                await tx.fill.upsert({
                    where: {
                        id: fill.id
                    },
                    update: {},
                    create: {
                        id: fill.id,
                        qty: fill.qty,
                        takerSide: fill.takerSide,
                        price: fill.price,
                        market: fill.market,
                        makerId: fill.makerUserId,
                        takerId: fill.takerUserId,
                        makerOrderId: fill.makerOrderId,
                        takerOrderId: fill.takerOrderId
                    }
                })
            }
        });
    } else if (parsed.data.type === "order_cancelled") {
        const { order } = parsed.data;
        await prisma.order.upsert({
            where: {
                id: order.orderId
            },
            update: {
                filledQty: order.filledQty,
                status: order.status
            },
            create: {
                id: order.orderId,
                userId: order.userId,
                market: order.market,
                price: order.price,
                qty: order.qty,
                filledQty: order.filledQty,
                side: order.side,
                type: order.orderType,
                status: order.status,
                createdAt: new Date(order.createdAt)
            }
        })
    }
}

export async function readerListener() {
    await createGroup();
    await reclaimStranded();

    setInterval(async () => {
        reclaimStranded().catch(err => console.error("db-worker: reclaim failed", err));
    }, 60000);

    for (;;) {
        try {
            const request: StreamReply = await reader.xReadGroup(
                DB_WORKER_GROUP,
                CONSUMER, {
                    key: ENGINE_EVENTS,
                    id: ">"
                }, {
                    COUNT: 1,
                    BLOCK: 0
                }
            );
            
            if (!request) {
                continue;
            }
            
            for (const stream of request) {
                for (const message of stream.messages) {
                    await handleMessage(message.message.data);
                    await writer.xAck(ENGINE_EVENTS, DB_WORKER_GROUP, message.id);
                }
            }
        } catch (err) {
            console.error("db-worker: loop error", err);
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
        }
    }
}

readerListener()