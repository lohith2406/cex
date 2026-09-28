import z from "zod";
import { marketSchema, type OrderSide } from "./types";
import { addBalanceRequestSchema, createOrderRequestSchema } from "./engine";

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

export const orderIdParamsSchema = z.object({
    orderId: z.uuid(),
});

export const marketQuerySchema = z.object({
    market: marketSchema
});

export const getTradesQuerySchema = z.object({
    market: marketSchema,
    limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const klineIntervalSchema = z.enum(["1m", "5m", "1h", "1d"]);

export const getKlinesQuerySchema = z.object({
    market: marketSchema,
    interval: klineIntervalSchema,
    end: z.coerce.number().int().optional(),
});

export type Candle = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export type Trade = {
    id: string;
    price: number;
    qty: number;
    takerSide: OrderSide;
    timestamp: number;
};