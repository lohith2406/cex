/*
 * Matching engine benchmark.
 *
 * Measures OrderBook.placeOrder in isolation: no Redis, no Postgres, no JSON.
 * That is deliberate. The number this produces is "how fast can the engine
 * match", which is the number worth quoting, because everything else in the
 * request path is network and is dominated by whatever host you deploy to.
 *
 * Every order is built before the clock starts, so allocation and string
 * building are not counted. Each run is preceded by a warmup pass on a throwaway
 * book so the JIT has compiled placeOrder before the measured pass.
 *
 * Run: bun run src/bench.ts [ordersPerScenario]
 */

import { OrderBook } from "./store/orderbook";
import type { IncomingOrder } from "@repo/common";

const N = Number(process.argv[2] ?? 100_000);
const WARMUP = 20_000;
const SWEEP_LEVELS = 10;
const PRICE_LEVELS = 1_000;

function order(id: number, side: "BUY" | "SELL", price: number, qty: number): IncomingOrder {
    return {
        orderId: `o${id}`,
        userId: `u${id % 1000}`,
        market: "BTC",
        side,
        orderType: "LIMIT",
        price,
        qty,
    };
}

type Stats = {
    name: string;
    count: number;
    wallMs: number;
    perSec: number;
    p50: number;
    p99: number;
    p999: number;
    max: number;
    fills: number;
    retained: number;
};

/**
 * Runs `orders` through a book and records per-call latency.
 * `setup` orders are placed first and are NOT timed.
 */
function measure(name: string, setup: IncomingOrder[], timed: IncomingOrder[]): Stats {
    const book = new OrderBook();
    for (const o of setup) book.placeOrder(o);

    // preallocated so the array never grows mid-measurement
    const latencies = new Float64Array(timed.length);
    let fills = 0;

    const start = performance.now();
    for (let i = 0; i < timed.length; i++) {
        const o = timed[i]!;
        const t0 = performance.now();
        const result = book.placeOrder(o);
        latencies[i] = performance.now() - t0;
        fills += result.fills.length;
    }
    const wallMs = performance.now() - start;

    // orders the engine is still holding after the run. heapUsed proved too
    // noisy across a forced GC to be worth reporting; this is unambiguous.
    const retained = book.saveSnapshot().orders.length;

    const sorted = Float64Array.from(latencies).sort();
    const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))]!;
    const us = (ms: number) => ms * 1000;

    return {
        name,
        count: timed.length,
        wallMs,
        perSec: (timed.length / wallMs) * 1000,
        p50: us(at(0.5)),
        p99: us(at(0.99)),
        p999: us(at(0.999)),
        max: us(sorted[sorted.length - 1]!),
        fills,
        retained,
    };
}

// ---------------------------------------------------------------------------
// scenario builders
// ---------------------------------------------------------------------------

/*
 * Every scenario keeps the book inside a fixed PRICE_LEVELS wide window.
 * That is not a convenience: resting an order linear scans the sorted Level[]
 * to find its slot, so cost per insert grows with the number of distinct price
 * levels (see the scaling table this prints at the end). A real book is bounded
 * by tick size and by liquidity clustering near the mid, so an unbounded window
 * would measure a book shape that cannot occur.
 */

/** Orders that never cross, so every one inserts and rests. Pure insert path. */
function restingOnly(n: number, idBase: number) {
    const setup: IncomingOrder[] = [];
    const timed: IncomingOrder[] = [];
    for (let i = 0; i < n; i++) {
        timed.push(order(idBase + i, "BUY", 1_000 + (i % PRICE_LEVELS), 1));
    }
    return { setup, timed };
}

/** Each taker is fully filled by exactly one resting maker. */
function oneMakerPerTaker(n: number, idBase: number) {
    const setup: IncomingOrder[] = [];
    const timed: IncomingOrder[] = [];
    for (let i = 0; i < n; i++) {
        setup.push(order(idBase + i, "SELL", 10_000 + (i % PRICE_LEVELS), 1));
    }
    for (let i = 0; i < n; i++) {
        // buys above the whole window, so each one crosses the current best ask
        timed.push(order(idBase + n + i, "BUY", 10_000 + PRICE_LEVELS, 1));
    }
    return { setup, timed };
}

/** Each taker consumes SWEEP_LEVELS resting maker orders before it is filled. */
function sweep(n: number, idBase: number) {
    const setup: IncomingOrder[] = [];
    const timed: IncomingOrder[] = [];
    let id = idBase;
    for (let i = 0; i < n * SWEEP_LEVELS; i++) {
        setup.push(order(id++, "SELL", 10_000 + (i % PRICE_LEVELS), 1));
    }
    for (let i = 0; i < n; i++) {
        timed.push(order(id++, "BUY", 10_000 + PRICE_LEVELS, SWEEP_LEVELS));
    }
    return { setup, timed };
}

/** How insert cost scales with the number of distinct price levels. */
function levelScaling() {
    console.log(`\nInsert cost vs book width (resting orders at unique prices):`);
    for (const levels of [1_000, 2_000, 4_000, 8_000, 16_000]) {
        const b = new OrderBook();
        const t0 = performance.now();
        for (let i = 0; i < levels; i++) b.placeOrder(order(i, "SELL", 10_000 + i, 1));
        const ms = performance.now() - t0;
        console.log(`  ${String(levels).padStart(6)} levels   ${((ms / levels) * 1000).toFixed(2).padStart(7)} us/insert`);
    }
}

// ---------------------------------------------------------------------------

function warmup() {
    const b = new OrderBook();
    for (let i = 0; i < WARMUP; i++) b.placeOrder(order(i, "SELL", 50_000 + i, 1));
    for (let i = 0; i < WARMUP; i++) b.placeOrder(order(WARMUP + i, "BUY", 50_000 + i, 1));
}

function row(s: Stats) {
    const f = (x: number) => x.toFixed(2).padStart(9);
    console.log(
        `${s.name.padEnd(22)}` +
        `${s.count.toLocaleString().padStart(9)}` +
        `${Math.round(s.perSec).toLocaleString().padStart(12)}` +
        `${f(s.p50)}${f(s.p99)}${f(s.p999)}${f(s.max)}` +
        `${s.fills.toLocaleString().padStart(11)}` +
        `${s.retained.toLocaleString().padStart(11)}`
    );
}

/** Cost of one performance.now() call, so we know how much of p50 is the probe. */
function probeOverheadNs(): number {
    const iters = 1_000_000;
    let sink = 0;
    const t0 = performance.now();
    for (let i = 0; i < iters; i++) sink += performance.now();   // sink keeps the JIT honest
    const ns = ((performance.now() - t0) / iters) * 1e6;
    if (sink === 0) throw new Error("unreachable");              // stops it being elided
    return ns;
}

console.log(`bun ${Bun.version}  ${process.platform}/${process.arch}`);
console.log(`${N.toLocaleString()} timed orders per scenario, ${WARMUP.toLocaleString()} warmup\n`);

warmup();

const results: Stats[] = [];

{
    const { setup, timed } = restingOnly(N, 0);
    results.push(measure("rest (no match)", setup, timed));
}
{
    const { setup, timed } = oneMakerPerTaker(N, 10_000_000);
    results.push(measure("fill (1 maker)", setup, timed));
}
{
    const sweepN = Math.max(1, Math.floor(N / SWEEP_LEVELS));
    const { setup, timed } = sweep(sweepN, 20_000_000);
    results.push(measure(`sweep (${SWEEP_LEVELS} makers)`, setup, timed));
}

console.log(
    "scenario".padEnd(22) + "orders".padStart(9) + "orders/sec".padStart(12) +
    "p50 us".padStart(9) + "p99 us".padStart(9) + "p99.9 us".padStart(9) + "max us".padStart(9) +
    "fills".padStart(11) + "retained".padStart(11)
);
console.log("-".repeat(90));
for (const r of results) row(r);

console.log(`\nLatency is per placeOrder call in microseconds, and includes one`);
console.log(`performance.now() call costing ~${probeOverheadNs().toFixed(0)} ns on this machine.`);
console.log(`orders/sec is derived from total wall time, so it is probe free.`);
console.log(`retained is orders still in the engine's map afterwards. Nothing is ever`);
console.log(`evicted, so filled and cancelled orders stay resident and land in snapshots.`);
console.log(`Book is held to ${PRICE_LEVELS.toLocaleString()} price levels throughout.`);

levelScaling();
