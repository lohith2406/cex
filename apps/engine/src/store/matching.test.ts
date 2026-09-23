import { expect, test } from "bun:test";
import { OrderBook } from "./orderbook";

let n = 0;

type Opts = { orderId?: string; userId?: string; orderType?: "LIMIT" | "MARKET" };

function mk(side: "BUY" | "SELL", price: number, qty: number, opts: Opts = {}) {
    return {
        orderId: opts.orderId ?? `o${++n}`,
        userId: opts.userId ?? "u1",
        market: "BTC" as const,
        side,
        orderType: opts.orderType ?? "LIMIT",
        price,
        qty,
    };
}

const buy = (price: number, qty: number, opts?: Opts) => mk("BUY", price, qty, opts);
const sell = (price: number, qty: number, opts?: Opts) => mk("SELL", price, qty, opts);

test("exact match empties the book", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "maker" }));

    const result = ob.placeOrder(buy(101, 5, { orderId: "taker" }));

    expect(result.filledQty).toBe(5);
    expect(result.remainingQty).toBe(0);
    expect(result.status).toBe("FILLED");
    expect(result.fills).toEqual([
        { price: 101, qty: 5, makerOrderId: "maker", takerOrderId: "taker" },
    ]);

    const depth = ob.depth("BTC");
    expect(depth.asks).toEqual([]);
    expect(depth.bids).toEqual([]);
});

test("a fully filled order does not also rest on the book", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));
    ob.placeOrder(buy(101, 5));

    // if placeOrder rested unconditionally, a phantom bid would be sitting here
    expect(ob.depth("BTC").bids).toEqual([]);
});

test("taker bigger than the book: fills what it can, rests the rest", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 3));

    const result = ob.placeOrder(buy(101, 10));

    expect(result.filledQty).toBe(3);
    expect(result.remainingQty).toBe(7);
    expect(result.status).toBe("PARTIALLY_FILLED");

    const depth = ob.depth("BTC");
    expect(depth.asks).toEqual([]);
    // only the UNFILLED 7 should be resting, not the original 10
    expect(depth.bids).toEqual([{ price: 101, qty: 7 }]);
});

test("maker bigger than the taker: maker keeps the remainder", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 10));

    const result = ob.placeOrder(buy(101, 3));

    expect(result.filledQty).toBe(3);
    expect(result.status).toBe("FILLED");
    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 7 }]);
    expect(ob.depth("BTC").bids).toEqual([]);
});

test("sweeps multiple price levels, cheapest first", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(102, 5, { orderId: "expensive" }));
    ob.placeOrder(sell(101, 5, { orderId: "cheap" }));

    const result = ob.placeOrder(buy(102, 8, { orderId: "taker" }));

    expect(result.filledQty).toBe(8);
    expect(result.status).toBe("FILLED");
    expect(result.fills).toEqual([
        { price: 101, qty: 5, makerOrderId: "cheap", takerOrderId: "taker" },
        { price: 102, qty: 3, makerOrderId: "expensive", takerOrderId: "taker" },
    ]);

    // 101 fully consumed and removed, 102 has 2 left
    expect(ob.depth("BTC").asks).toEqual([{ price: 102, qty: 2 }]);
});

test("taker gets the maker's price, not their own", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));

    // willing to pay 105, but the resting ask is 101
    const result = ob.placeOrder(buy(105, 5));

    expect(result.fills[0]?.price).toBe(101);
});

test("time priority: the older maker fills first", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "alice", userId: "alice" }));
    ob.placeOrder(sell(101, 5, { orderId: "bob", userId: "bob" }));

    const result = ob.placeOrder(buy(101, 6, { orderId: "taker" }));

    expect(result.fills).toEqual([
        { price: 101, qty: 5, makerOrderId: "alice", takerOrderId: "taker" },
        { price: 101, qty: 1, makerOrderId: "bob", takerOrderId: "taker" },
    ]);
    // bob has 4 left at the same level
    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 4 }]);
});

test("does not cross: bid below the best ask just rests", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));

    const result = ob.placeOrder(buy(99, 5));

    expect(result.filledQty).toBe(0);
    expect(result.status).toBe("OPEN");
    expect(result.fills).toEqual([]);
    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 5 }]);
    expect(ob.depth("BTC").bids).toEqual([{ price: 99, qty: 5 }]);
});

test("sell side crosses too", () => {
    const ob = new OrderBook();
    ob.placeOrder(buy(100, 5, { orderId: "maker" }));

    const result = ob.placeOrder(sell(98, 5, { orderId: "taker" }));

    expect(result.status).toBe("FILLED");
    // sold into a bid of 100 despite asking 98
    expect(result.fills).toEqual([
        { price: 100, qty: 5, makerOrderId: "maker", takerOrderId: "taker" },
    ]);
});

test("market order against an empty book expires", () => {
    const ob = new OrderBook();

    const result = ob.placeOrder(buy(0, 5, { orderType: "MARKET" }));

    expect(result.filledQty).toBe(0);
    expect(result.status).toBe("EXPIRED");
    expect(ob.depth("BTC").bids).toEqual([]);
});

test("market order fills what it can and expires the rest", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 3));

    const result = ob.placeOrder(buy(999, 10, { orderType: "MARKET" }));

    expect(result.filledQty).toBe(3);
    expect(result.remainingQty).toBe(7);
    expect(result.status).toBe("EXPIRED");
    // the unfilled 7 must NOT rest
    expect(ob.depth("BTC").bids).toEqual([]);
});

test("lastTradedPrice follows the last fill", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));
    ob.placeOrder(sell(102, 5));

    expect(ob.depth("BTC").lastTradedPrice).toBe(0);

    ob.placeOrder(buy(102, 8));

    expect(ob.depth("BTC").lastTradedPrice).toBe(102);
});

test("an emptied level is removed, not left at zero", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));
    ob.placeOrder(sell(102, 5));

    ob.placeOrder(buy(101, 5));

    expect(ob.depth("BTC").asks).toEqual([{ price: 102, qty: 5 }]);
});

test("markets do not match against each other", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));

    const ethBuy = { ...buy(101, 5), market: "ETH" as const };
    const result = ob.placeOrder(ethBuy);

    expect(result.filledQty).toBe(0);
    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 5 }]);
});
