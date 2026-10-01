import z from "zod";
import {
    assetSchema,
    fillSchema,
    incomingOrderSchema,
    marketSchema,
    orderSchema,
    orderStatusSchema,
} from "./types";

export const ENGINE_REQUESTS = "engine:requests";
export const ENGINE_REPLIES = "engine:replies";

export const createOrderRequestSchema = incomingOrderSchema.omit({
    orderId: true
}).extend({
    type: z.literal("create_order"),
    reqId: z.uuid(),
});

export const addBalanceRequestSchema = z.object({
    type: z.literal("add_balance"),
    reqId: z.uuid(),
    userId: z.uuid(),
    asset: assetSchema,
    amount: z.number().int().positive(),
});

export const getBalanceRequestSchema = z.object({
    type: z.literal("get_balance"),
    reqId: z.uuid(),
    userId: z.uuid(),
})

export const cancelOrderRequestSchema = z.object({
    type: z.literal("cancel_order"),
    reqId: z.uuid(),
    userId: z.uuid(),
    orderId: z.uuid(),
});

export const getDepthRequestSchema = z.object({
    type: z.literal("get_depth"),
    reqId: z.uuid(),
    market: marketSchema,
});

export const getOpenOrdersRequestSchema = z.object({
    type: z.literal("get_open_orders"),
    reqId: z.uuid(),
    userId: z.uuid()
});

export const engineRequestSchema = z.discriminatedUnion("type", [
    createOrderRequestSchema,
    addBalanceRequestSchema,
    getBalanceRequestSchema,
    cancelOrderRequestSchema,
    getDepthRequestSchema,
    getOpenOrdersRequestSchema
]);

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type AddBalanceRequest = z.infer<typeof addBalanceRequestSchema>;
export type GetBalanceRequest = z.infer<typeof getBalanceRequestSchema>;
export type CancelOrderRequest = z.infer<typeof cancelOrderRequestSchema>;
export type GetDepthRequest = z.infer<typeof getDepthRequestSchema>;
export type GetOpenOrdersRequest = z.infer<typeof getOpenOrdersRequestSchema>;

export const createOrderReplySchema = z.object({
    type: z.literal("create_order"),
    reqId: z.uuid(),
    data: z.object({
        orderId: z.uuid(),
        filledQty: z.number().int(),
        remainingQty: z.number().int(),
        status: orderStatusSchema,
        fills: z.array(fillSchema),
    }),
});

export const addBalanceReplySchema = z.object({
    type: z.literal("add_balance"),
    reqId: z.uuid(),
    data: z.object({
        asset: assetSchema,
        total: z.number().int(),
        locked: z.number().int(),
    }),
});

const balanceSchema = z.object({
    total: z.number().int(),
    locked: z.number().int(),
})

export const getBalanceReplySchema = z.object({
    type: z.literal("get_balance"),
    reqId: z.uuid(),
    data: z.record(assetSchema, balanceSchema)
});

export const cancelOrderReplySchema = z.object({
    type: z.literal("cancel_order"),
    reqId: z.uuid(),
    data: z.object({
        order: orderSchema
    }),
});


const depthLevelSchema = z.object({
    price: z.number().int(),
    qty: z.number().int(),
});

export const depthSchema = z.object({
    bids: z.array(depthLevelSchema),
    asks: z.array(depthLevelSchema),
    lastTradedPrice: z.number().int().nullable(),
});

export const getDepthReplySchema = z.object({
    type: z.literal("get_depth"),
    reqId: z.uuid(),
    data: depthSchema,
});

export type Depth = z.infer<typeof depthSchema>;

export const errorReplySchema = z.object({
    type: z.literal("error"),
    reqId: z.uuid(),
    error: z.string(),
});

export const getOpenOrdersReplySchema = z.object({
    type: z.literal("get_open_orders"),
    reqId: z.uuid(),
    data: z.array(orderSchema)
})

export const engineReplySchema = z.discriminatedUnion("type", [
    createOrderReplySchema,
    addBalanceReplySchema,
    getBalanceReplySchema,
    cancelOrderReplySchema,
    getDepthReplySchema,
    errorReplySchema,
    getOpenOrdersReplySchema
]);

export type EngineRequest = z.infer<typeof engineRequestSchema>;
export type CreateOrderReply = z.infer<typeof createOrderReplySchema>;
export type AddBalanceReply = z.infer<typeof addBalanceReplySchema>;
export type GetBalanceReply = z.infer<typeof getBalanceReplySchema>;
export type CancelOrderReply = z.infer<typeof cancelOrderReplySchema>;
export type GetDepthReply = z.infer<typeof getDepthReplySchema>;
export type ErrorReply = z.infer<typeof errorReplySchema>;
export type GetOpenOrdersReply = z.infer<typeof getOpenOrdersReplySchema>;
export type EngineReply = z.infer<typeof engineReplySchema>;
