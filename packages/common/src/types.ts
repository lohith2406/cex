import z from "zod";

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

export const incomingOrderSchema = z.object({
    orderId: z.string(),
    userId: z.uuid(),
    market: marketSchema,
    side: sideSchema,
    orderType: orderTypeSchema,
    price: z.number().int().positive(),
    qty: z.number().int().positive(),
});

export const orderSchema = incomingOrderSchema.extend({
    filledQty: z.number().int(),
    status: orderStatusSchema,
    createdAt: z.number().int()
});

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

export type IncomingOrder = z.infer<typeof incomingOrderSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Fill = z.infer<typeof fillSchema>;
