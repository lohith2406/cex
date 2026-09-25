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

test("cancelling a resting order takes it off the book", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "o1", userId: "alice" }));

    const cancelled = ob.cancelOrder("o1", "alice");

    expect(cancelled?.status).toBe("CANCELLED");
    expect(ob.depth("BTC").asks).toEqual([]);
});

test("cancelling the only order at a price removes the whole level", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "o1", userId: "alice" }));
    ob.placeOrder(sell(102, 3, { orderId: "o2", userId: "bob" }));

    ob.cancelOrder("o1", "alice");

    // the 101 level is gone entirely, not left sitting at qty 0
    expect(ob.depth("BTC").asks).toEqual([{ price: 102, qty: 3 }]);
});

test("cancelling one of several at the same price leaves the others", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "first", userId: "alice" }));
    ob.placeOrder(sell(101, 3, { orderId: "middle", userId: "bob" }));
    ob.placeOrder(sell(101, 2, { orderId: "last", userId: "carol" }));

    ob.cancelOrder("middle", "bob");

    // 10 total, minus bob's 3
    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 7 }]);
});

test("a cancelled order no longer matches", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "o1", userId: "alice" }));
    ob.cancelOrder("o1", "alice");

    const result = ob.placeOrder(buy(101, 5, { userId: "bob" }));

    expect(result.order.filledQty).toBe(0);
    expect(result.fills).toEqual([]);
});

test("cancelling a partially filled order only releases the remainder", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "maker", userId: "alice" }));
    ob.placeOrder(buy(101, 2, { userId: "bob" }));      // fills 2 of alice's 5

    const cancelled = ob.cancelOrder("maker", "alice");

    expect(cancelled?.status).toBe("CANCELLED");
    expect(cancelled?.filledQty).toBe(2);               // the 2 that traded stay filled
    expect(ob.depth("BTC").asks).toEqual([]);           // the remaining 3 are gone
});

test("cancelling leaves the level's total consistent with what's left", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "maker", userId: "alice" }));
    ob.placeOrder(sell(101, 4, { orderId: "other", userId: "bob" }));
    ob.placeOrder(buy(101, 2, { userId: "carol" }));    // eats 2 of alice's 5

    // level now holds alice 3 + bob 4 = 7
    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 7 }]);

    ob.cancelOrder("maker", "alice");                   // remove alice's remaining 3

    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 4 }]);
});

test("you cannot cancel someone else's order", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "o1", userId: "alice" }));

    const cancelled = ob.cancelOrder("o1", "mallory");

    expect(cancelled).toBeNull();
    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 5 }]);   // untouched
});

test("you cannot cancel an already filled order", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "o1", userId: "alice" }));
    ob.placeOrder(buy(101, 5, { userId: "bob" }));      // fully fills it

    expect(ob.cancelOrder("o1", "alice")).toBeNull();
});

test("cancelling twice is a no-op the second time", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "o1", userId: "alice" }));

    expect(ob.cancelOrder("o1", "alice")?.status).toBe("CANCELLED");
    expect(ob.cancelOrder("o1", "alice")).toBeNull();
});

test("an unknown order id returns null", () => {
    const ob = new OrderBook();

    expect(ob.cancelOrder("never-existed", "alice")).toBeNull();
});

test("cancelling in one market does not touch another", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5, { orderId: "o1", userId: "alice" }));
    ob.placeOrder({ ...sell(101, 5, { orderId: "o2", userId: "alice" }), market: "ETH" as const });

    ob.cancelOrder("o1", "alice");

    expect(ob.depth("BTC").asks).toEqual([]);
    expect(ob.depth("ETH").asks).toEqual([{ price: 101, qty: 5 }]);
});
