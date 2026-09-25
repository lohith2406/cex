import z from "zod";
import { fillSchema, orderSchema } from "./engine";

export const ENGINE_EVENTS = "engine:events";
export const DB_WORKER_GROUP = "db-workers"

export const orderResultMessageSchema = z.object({
    type: z.literal("order_result"),
    order: orderSchema,
    makerOrders: z.array(orderSchema),
    fills: z.array(fillSchema)
});

export const dbMessageSchema = z.discriminatedUnion("type", [
    orderResultMessageSchema
])

export type OrderResultMessage = z.infer<typeof orderResultMessageSchema>;
export type DbMessage = z.infer<typeof dbMessageSchema>