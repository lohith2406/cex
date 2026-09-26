import z from "zod";
import { fillSchema, marketSchema, orderSchema, type Market } from "./engine";

export const ENGINE_EVENTS = "engine:events";
export const DB_WORKER_GROUP = "db-workers";

export function depthChannel(market: Market) {
    return `depth.${market}`;
};

export function tradeChannel(market: Market) {
    return `trade.${market}`;
};

export const orderResultMessageSchema = z.object({
    type: z.literal("order_result"),
    order: orderSchema,
    makerOrders: z.array(orderSchema),
    fills: z.array(fillSchema)
});

export const orderCancelledMessageSchema = z.object({
    type: z.literal("order_cancelled"),
    order: orderSchema
})

export const dbMessageSchema = z.discriminatedUnion("type", [
    orderResultMessageSchema,
    orderCancelledMessageSchema
])

export type OrderResultMessage = z.infer<typeof orderResultMessageSchema>;
export type OrderCancelledMessage = z.infer<typeof orderCancelledMessageSchema>;
export type DbMessage = z.infer<typeof dbMessageSchema>

export const orderIdParamsSchema = z.object({
    orderId: z.uuid(),
});

export const wsClientMessageSchema = z.object({
    method: z.enum(["SUBSCRIBE", "UNSUBSCRIBE"]),
    params: z.array(z.string()),
});