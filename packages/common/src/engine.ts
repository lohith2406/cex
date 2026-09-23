import z from "zod";

export const ENGINE_REQUESTS="engine:requests";
export const ENGINE_REPLIES="engine:replies";

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

export const engineRequestSchema = z.discriminatedUnion("type", [
    createOrderRequestSchema,
    addBalanceRequestSchema
]);

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type AddBalanceRequest = z.infer<typeof addBalanceRequestSchema>;

export const engineReplySchema = z.discriminatedUnion("ok", [
    z.object({
        reqId: z.uuid(), 
        ok: z.literal(true),
        data: z.object({
            orderId: z.uuid(),
            filledQty: z.number().int(),
            remainingQty: z.number().int(),
            status: orderStatusSchema,
            fills: z.array(z.object({
                price: z.number().int(),
                qty: z.number().int(),
                makerOrderId: z.string(),
                takerOrderId: z.string()
            }))
        })
    }),
    z.object({
        reqId: z.uuid(),
        ok: z.literal(false),
        error: z.string()
    })
]);

export type EngineRequest = z.infer<typeof engineRequestSchema>;
export type EngineReply = z.infer<typeof engineReplySchema>;

export const createOrderBodySchema = createOrderRequestSchema.omit({
    type: true,
    reqId: true,
    userId: true
});