import { getKlinesQuerySchema, zodErrorMessage, type Candle } from "@repo/common";
import type { Request, Response } from "express";
import { getKlines as klinesQuery } from "@repo/db";
import { prisma } from "../db";

const INTERVAL_SECONDS = {
    "1m": 60,
    "5m": 5 * 60,
    "1h": 60 * 60,
    "1d": 24 * 60 * 60
};

const MAX_CANDLES = 500;

export async function getKlines(req: Request, res: Response) {
    const parsed = getKlinesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        res.status(400).json({
            error: zodErrorMessage(parsed.error)
        });
        return;
    }

    const bucketSeconds = INTERVAL_SECONDS[parsed.data.interval];
    const windowMs = bucketSeconds * 1000; // width of one candle

    const endMs = parsed.data.end ?? Date.now();
    const startMs = endMs - windowMs * MAX_CANDLES; // end - width of the whole window

    const rows = await prisma.$queryRawTyped(klinesQuery(bucketSeconds, parsed.data.market, new Date(startMs), new Date(endMs)));
    /*
    rows is one object per time bucket, oldest first:
        [
            { bucket: 2026-09-27T10:00:00.000Z, open: 100, high: 103, low: 99,  close: 99,  volume: 7 },
            { bucket: 2026-09-27T10:01:00.000Z, open: 101, high: 101, low: 101, close: 101, volume: 3 },
        ]
    */

    const candles: Candle[] = rows.map((row) => ({
        timestamp: row.bucket!.getTime(),
        open: row.open!,
        high: row.high!,
        low: row.low!,
        close: row.close!,
        volume: row.volume!
    }));

    res.status(200).json({
        message: "Klines fetched",
        data: candles
    });
}