import { expect, test } from "bun:test";
import { OrderBook } from "./orderbook";

let n = 0;

function sell(price: number, qty: number) {
    return {
        orderId: `o${++n}`,
        userId: "u1",
        market: "BTC" as const,
        side: "SELL" as const,
        orderType: "LIMIT" as const,
        price,
        qty,
    };
}

function buy(price: number, qty: number) {
    return { ...sell(price, qty), side: "BUY" as const };
}

test("asks sort ascending, cheapest first", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));
    ob.placeOrder(sell(102, 10));
    ob.placeOrder(sell(99, 2));

    expect(ob.depth("BTC").asks).toEqual([
        { price: 99, qty: 2 },
        { price: 101, qty: 5 },
        { price: 102, qty: 10 },
    ]);
});

test("bids sort descending, highest first", () => {
    const ob = new OrderBook();
    ob.placeOrder(buy(100, 7));
    ob.placeOrder(buy(102, 1));
    ob.placeOrder(buy(99, 4));

    expect(ob.depth("BTC").bids).toEqual([
        { price: 102, qty: 1 },
        { price: 100, qty: 7 },
        { price: 99, qty: 4 },
    ]);
});

test("inserting at either end works", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 1));
    ob.placeOrder(sell(150, 1)); // past the end -> findIndex returns -1
    ob.placeOrder(sell(50, 1)); // before everything -> index 0

    expect(ob.depth("BTC").asks.map((l) => l.price)).toEqual([50, 101, 150]);
});

test("same price merges into one level", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));
    ob.placeOrder(sell(101, 3));

    expect(ob.depth("BTC").asks).toEqual([{ price: 101, qty: 8 }]);
});

test("bids and asks are separate sides of the same book", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));
    ob.placeOrder(buy(99, 4));

    const depth = ob.depth("BTC");
    expect(depth.asks).toEqual([{ price: 101, qty: 5 }]);
    expect(depth.bids).toEqual([{ price: 99, qty: 4 }]);
});

test("markets are independent", () => {
    const ob = new OrderBook();
    ob.placeOrder(sell(101, 5));

    expect(ob.depth("ETH").asks).toEqual([]);
    expect(ob.depth("ETH").bids).toEqual([]);
});

test("a resting order reports nothing filled", () => {
    const ob = new OrderBook();
    const result = ob.placeOrder(sell(101, 5));

    expect(result.order.filledQty).toBe(0);
    expect(result.order.qty - result.order.filledQty).toBe(5);
    expect(result.order.status).toBe("OPEN");
    expect(result.fills).toEqual([]);
    expect(result.makerOrders).toEqual([]);
});
