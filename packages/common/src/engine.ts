import z from "zod";

export const ENGINE_REQUESTS = "engine:requests";
export const ENGINE_REPLIES = "engine:replies";

export const marketSchema = z.enum(["BTC", "ETH", "SOL"]);
export const sideSchema = z.enum(["BUY", "SELL"]);
export const orderTypeSchema = z.enum(["MARKET", "LIMIT"]);
export const orderStatusSchema = z.enum(["OPEN", "FILLED", "PARTIALLY_FILLED", "CANCELLED", "EXPIRED"]);
export const assetSchema = z.enum(["USD", "BTC", "ETH", "SOL"]);

export type Market = z.infer<typeof marketSchema>;
export type OrderSide = z.infer<typeof sideSchema>;
export type OrderType = z.infer<typeof orderTypeSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type Asset = z.infer<typeof assetSchema>;

export const createOrderRequestSchema = z.object({
    type: z.literal("create_order"),
    reqId: z.uuid(),
    userId: z.uuid(),
    market: marketSchema,
    side: sideSchema,
    orderType: orderTypeSchema,
    price: z.number().int().positive(),
    qty: z.number().int().positive(),
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

export const engineRequestSchema = z.discriminatedUnion("type", [
    createOrderRequestSchema,
    addBalanceRequestSchema,
    getBalanceRequestSchema,
    cancelOrderRequestSchema
]);

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type AddBalanceRequest = z.infer<typeof addBalanceRequestSchema>;
export type GetBalanceRequest = z.infer<typeof getBalanceRequestSchema>;
export type CancelOrderRequest = z.infer<typeof cancelOrderRequestSchema>;

export const incomingOrderSchema = createOrderRequestSchema.omit({ 
    type: true, 
    reqId: true 
}).extend({ orderId: z.string() });

export const orderSchema = incomingOrderSchema.extend({
    filledQty: z.number().int(),
    status: orderStatusSchema,
    createdAt: z.number().int()
});

export type Order = z.infer<typeof orderSchema>;

export const fillSchema = z.object({
    id: z.uuid(),
    market: marketSchema,
    price: z.number().int(),
    qty: z.number().int(),
    takerSide: sideSchema,
    makerOrderId: z.uuid(),
    makerUserId: z.uuid(),
    takerOrderId: z.uuid(),
    takerUserId: z.uuid(),
});

export type Fill = z.infer<typeof fillSchema>;

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

export const errorReplySchema = z.object({
    type: z.literal("error"),
    reqId: z.uuid(),
    error: z.string(),
});

export const engineReplySchema = z.discriminatedUnion("type", [
    createOrderReplySchema,
    addBalanceReplySchema,
    getBalanceReplySchema,
    cancelOrderReplySchema,
    errorReplySchema,
]);

export type IncomingOrder = z.infer<typeof incomingOrderSchema>;

export type EngineRequest = z.infer<typeof engineRequestSchema>;
export type CreateOrderReply = z.infer<typeof createOrderReplySchema>;
export type AddBalanceReply = z.infer<typeof addBalanceReplySchema>;
export type GetBalanceReply = z.infer<typeof getBalanceReplySchema>;
export type CancelOrderReply = z.infer<typeof cancelOrderReplySchema>;
export type ErrorReply = z.infer<typeof errorReplySchema>;
export type EngineReply = z.infer<typeof engineReplySchema>;

export const createOrderBodySchema = createOrderRequestSchema.omit({
    type: true,
    reqId: true,
    userId: true
});

export const addBalanceBodySchema = addBalanceRequestSchema.omit({
    type: true,
    reqId: true,
    userId: true
});

export const cancelOrderParamsSchema = cancelOrderRequestSchema.pick({
    orderId: true
});