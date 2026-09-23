import z from "zod";

export const ENGINE_REQUESTS="engine:requests";
export const ENGINE_REPLIES="engine:replies";

export const engineRequestSchema = z.object({
    reqId: z.uuid(),
    userId: z.uuid(),
    market: z.enum(["BTC", "ETH", "SOL"]),
    side: z.enum(["BUY", "SELL"]),
    orderType: z.enum(["MARKET", "LIMIT"]),
    price: z.number().int().positive(),
    qty: z.number().int().positive()
});

export const engineReplySchema = z.discriminatedUnion("ok", [
    z.object({
        reqId: z.uuid(), 
        ok: z.literal(true)
    }),
    z.object({
        reqId: z.uuid(),
        ok: z.literal(false),
        error: z.string()
    })
]);

export type EngineRequest = z.infer<typeof engineRequestSchema>;
export type EngineReply = z.infer<typeof engineReplySchema>;
export const createOrderBodySchema = engineRequestSchema.omit({
    reqId: true,
    userId: true
});