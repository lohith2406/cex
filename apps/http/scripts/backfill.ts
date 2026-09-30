/*
 * Writes a few days of made-up trade history straight into Postgres so the
 * chart has something to draw. Klines are aggregated from Fill rows, so fills
 * with past timestamps become past candles.
 *
 * This bypasses the engine on purpose: history is only ever read from
 * Postgres, and the engine has no way to place a trade in the past. Nothing
 * here changes the live book or anyone's balance. Every order is written as
 * FILLED, so none of them look like resting orders the engine doesn't know.
 *
 * The walk is generated backwards from END_PRICE, so the newest candle lines
 * up with the seeded book around 100.
 *
 * Needs the seed users, so run `bun run seed` first.
 * Refuses to run if the window already has history; pass --force to add more.
 *
 * Run: bun run backfill   (from apps/http)
 */

import { prisma } from "../src/db";

const MARKET = "BTC";
const DAYS = 3;
const END_PRICE = 100;
const MIN_GAP_MS = 60_000;
const MAX_GAP_MS = 240_000;
const CHUNK = 1000;

const now = Date.now();
const start = now - DAYS * 24 * 60 * 60 * 1000;

function between(min: number, max: number) {
    return min + Math.random() * (max - min);
}

// roughly bell shaped, centred on 0, mostly within -1.5..1.5
function wobble() {
    return Math.random() + Math.random() + Math.random() - 1.5;
}

const existing = await prisma.fill.count({
    where: { market: MARKET, createdAt: { gte: new Date(start) } },
});

if (existing > 100 && !process.argv.includes("--force")) {
    console.error(`${existing} ${MARKET} fills already exist in the last ${DAYS} days. Pass --force to add more.`);
    process.exit(1);
}

const [buyer, seller] = await Promise.all(
    ["buyer@seed.local", "seller@seed.local"].map((email) =>
        prisma.user.findUnique({ where: { email }, select: { id: true } })
    )
);

if (!buyer || !seller) {
    console.error("seed users not found. run `bun run seed` first.");
    process.exit(1);
}

type Trade = { time: number; price: number; qty: number; takerSide: "BUY" | "SELL" };
const trades: Trade[] = [];

// walk backwards in time from the current price, pulled gently back towards it
// so the history doesn't wander off to 30 or 300
let price = END_PRICE;
for (let time = now - 5 * 60_000; time > start; time -= between(MIN_GAP_MS, MAX_GAP_MS)) {
    trades.push({
        time,
        price,
        qty: Math.ceil(between(0, 5)),
        takerSide: Math.random() < 0.5 ? "BUY" : "SELL",
    });

    const pull = (END_PRICE - price) * 0.03;
    price = Math.max(1, Math.round(price + wobble() * 1.4 + pull));
}

const orders = [];
const fills = [];

for (const trade of trades) {
    const buyerIsTaker = trade.takerSide === "BUY";
    const makerOrderId = crypto.randomUUID();
    const takerOrderId = crypto.randomUUID();
    const takerId = buyerIsTaker ? buyer.id : seller.id;
    const makerId = buyerIsTaker ? seller.id : buyer.id;

    const base = {
        market: MARKET,
        price: trade.price,
        qty: trade.qty,
        filledQty: trade.qty,
        type: "LIMIT",
        status: "FILLED",
    } as const;

    orders.push(
        // the maker was resting a little before the taker crossed it
        { ...base, id: makerOrderId, userId: makerId, side: buyerIsTaker ? "SELL" : "BUY", createdAt: new Date(trade.time - 30_000) } as const,
        { ...base, id: takerOrderId, userId: takerId, side: trade.takerSide, createdAt: new Date(trade.time) } as const,
    );

    fills.push({
        market: MARKET,
        price: trade.price,
        qty: trade.qty,
        takerSide: trade.takerSide,
        makerId,
        takerId,
        makerOrderId,
        takerOrderId,
        createdAt: new Date(trade.time),
    } as const);
}

for (let i = 0; i < orders.length; i += CHUNK) {
    await prisma.order.createMany({ data: orders.slice(i, i + CHUNK) });
}
for (let i = 0; i < fills.length; i += CHUNK) {
    await prisma.fill.createMany({ data: fills.slice(i, i + CHUNK) });
}

const prices = trades.map((t) => t.price);
console.log(`backfilled ${MARKET}: ${trades.length} trades over ${DAYS} days, prices ${Math.min(...prices)}-${Math.max(...prices)}`);
process.exit(0);
