import type { Market, OrderSide, OrderStatus, OrderType, Fill, IncomingOrder } from "@repo/common";

type RestingOrder = {
    orderId: string;
    userId: string;
}

type Level = {
    price: number;
    totalQty: number;
    orders: RestingOrder[]
}

type Book = {
    bids: Level[];
    asks: Level[];
    lastTradedPrice: number;
}

/*
"BTC": {
    bids: [
      { price: 100, totalQty: 7,  orders: [
          { orderId: "o4", userId: "eve" }
        ]},
      { price: 99,  totalQty: 4,  orders: [
          { orderId: "o5", userId: "dave" }
        ]}
    ],
    asks: [
      { price: 101, totalQty: 8,  orders: [
          { orderId: "o1", userId: "alice" },
          { orderId: "o2", userId: "bob" }
        ]},
      { price: 102, totalQty: 10, orders: [
          { orderId: "o3", userId: "carol" }
        ]}
    ],
    lastTradedPrice: 100
  }
*/

type Order = IncomingOrder & {
    filledQty: number;
    status: OrderStatus;
}

type MatchResult = {
    order: Order;
    makerOrders: Order[];
    fills: Fill[];
}


export class OrderBook {
    private books = new Map<Market, Book>();
    private orders = new Map<string, Order>();     // orderId: Order

    placeOrder(order: IncomingOrder): MatchResult {
        const book = this.getOrCreateBook(order.market);
        const opposite = order.side === "BUY" ? book.asks : book.bids;
        let remainingQty = order.qty;
        const fills: Fill[] = [];

        const takerOrder: Order = {
            ...order,
            filledQty: 0,
            status: "OPEN"
        };

        this.orders.set(order.orderId, takerOrder);
        const makerOrders: Order[] = [];

        while (remainingQty > 0 && opposite.length > 0) {
            const best = opposite[0];
            if (!best) {
                break;
            }
            const crosses = order.side === "BUY" ? order.price >= best.price : order.price <= best.price
            if (!crosses) {
                break
            }

            while (remainingQty > 0 && best.orders.length > 0) {
                const restingOrder = best.orders[0];
                if (!restingOrder) {
                    break;
                }

                const makerOrder = this.orders.get(restingOrder.orderId);
                if (!makerOrder) {
                    throw new Error(`orderbook: resting entry ${restingOrder.orderId} has no order record`);
                }
                const makerRemainingQty = makerOrder.qty - makerOrder.filledQty

                const tradeQty = Math.min(remainingQty, makerRemainingQty);
    
                fills.push({
                    market: order.market,
                    price: best.price,
                    qty: tradeQty,
                    takerSide: order.side,
                    makerOrderId: restingOrder.orderId,
                    makerUserId: restingOrder.userId,
                    takerOrderId: order.orderId,
                    takerUserId: order.userId
                });

                makerOrder.filledQty += tradeQty;
                makerOrder.status = makerOrder.filledQty === makerOrder.qty ? "FILLED" : "PARTIALLY_FILLED";
                makerOrders.push(makerOrder);

                takerOrder.filledQty += tradeQty;
                best.totalQty -= tradeQty;
                remainingQty -= tradeQty;
                book.lastTradedPrice = best.price;

                if (makerOrder.filledQty === makerOrder.qty) {
                    best.orders.shift();
                }

            }

            if (best.orders.length === 0) {
                opposite.shift();
            }
        }

        if (remainingQty > 0 && order.orderType === "LIMIT") {
            this.restOrder(book, order, remainingQty);
        }

        let status: OrderStatus = "OPEN";

        if (remainingQty === 0) {
            status = "FILLED";
        } else if (order.orderType === "MARKET") {
            status = "EXPIRED";
        } else if (remainingQty === order.qty) {
            status = "OPEN"
        } else if (remainingQty > 0) {
            status = "PARTIALLY_FILLED"
        }
        
        takerOrder.status = status;

        return {
            order: takerOrder,
            makerOrders,
            fills
        };
    }

    private getOrCreateBook(market: Market): Book {
        let book = this.books.get(market);
        if (!book) {
            book = {
                bids: [],
                asks: [],
                lastTradedPrice: 0
            };
            this.books.set(market, book);
        }

        return book;
    }

    private restOrder(book: Book, order: IncomingOrder, remainingQty: number): void {
        const levels = order.side === "BUY" ? book.bids : book.asks;
        const restingOrder: RestingOrder = {
            orderId: order.orderId,
            userId: order.userId,
        }
        const existing = levels.find(level => level.price === order.price);

        if (existing) {
            existing.orders.push(restingOrder);
            existing.totalQty += remainingQty;
            return;
        }

        const newLevel: Level = {
            price: order.price,
            totalQty: remainingQty,
            orders: [restingOrder]
        };

        const insertAt = levels.findIndex(level => order.side === "BUY" ? order.price > level.price : order.price < level.price);

        if (insertAt === -1) {
            levels.push(newLevel);
        } else {
            levels.splice(insertAt, 0, newLevel);
        }
    }

    depth(market: Market) {
        const book = this.getOrCreateBook(market);
        const bids = book.bids.map((level) => {
            return { 
                price: level.price, 
                qty: level.totalQty 
            }
        })

        const asks = book.asks.map((level) => {
            return {
                price: level.price,
                qty: level.totalQty
            };
        })

        return { bids, asks, lastTradedPrice: book.lastTradedPrice };
    }
}