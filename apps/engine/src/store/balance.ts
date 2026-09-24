import type { Asset, Fill, Market, OrderSide, IncomingOrder } from "@repo/common";

type Balance = {
    total: number;
    locked: number;
}

type UserBalances = Record<Asset, Balance>
type AssetAmount = { asset: Asset; amount: number };

const QUOTE: Asset = "USD";

function emptyUserBalances(): Record<Asset, Balance> {
    return {
        USD: { total: 0, locked: 0 },
        BTC: { total: 0, locked: 0 },
        ETH: { total: 0, locked: 0 },
        SOL: { total: 0, locked: 0 },
    };
}

export class BalanceStore {
    private balances = new Map<string, UserBalances>();

    getOrCreateBalances(userId: string): UserBalances {
        let userBalances = this.balances.get(userId);

        if (!userBalances) {
            userBalances = emptyUserBalances();
            this.balances.set(userId, userBalances);
        }

        return userBalances;
    }
 
    available(userId: string, asset: Asset): number {
        const userBalances = this.getOrCreateBalances(userId);
        return userBalances[asset].total - userBalances[asset].locked;
    } 

    deposit(userId: string, { asset, amount }: AssetAmount): void {
        const userBalances = this.getOrCreateBalances(userId);
        userBalances[asset].total += amount;
    }

    private cost(market: Market, side: OrderSide, price: number, qty: number): AssetAmount {
        return side === "BUY" ? { asset: QUOTE, amount: price * qty } : { asset: market, amount: qty };
    }

    canAfford(order: IncomingOrder): boolean {
        const { asset, amount } = this.cost(order.market, order.side, order.price, order.qty); 
        return this.available(order.userId, asset) >= amount;
    }

    lock(order: IncomingOrder): void {
        const { asset, amount } = this.cost(order.market, order.side, order.price, order.qty);
        const userBalances = this.getOrCreateBalances(order.userId);
        userBalances[asset].locked += amount;
    }

    unlock(order: IncomingOrder, qty: number): void {
        const { asset, amount } = this.cost(order.market, order.side, order.price, qty);
        const userBalances = this.getOrCreateBalances(order.userId);
        userBalances[asset].locked -= amount;
    }

    settle(fill: Fill, takerLimitPrice: number): void {
        const market = fill.market;
        const quoteAmount = fill.price * fill.qty;

        const taker = this.getOrCreateBalances(fill.takerUserId);
        const maker = this.getOrCreateBalances(fill.makerUserId);

        if (fill.takerSide === "BUY") {
            taker[QUOTE].locked -= takerLimitPrice * fill.qty;
            taker[QUOTE].total -= quoteAmount;
            taker[market].total += fill.qty;

            maker[market].locked -= fill.qty;
            maker[market].total -= fill.qty;
            maker[QUOTE].total += quoteAmount;
        } else {
            taker[market].locked -= fill.qty;
            taker[market].total -= fill.qty;
            taker[QUOTE].total += quoteAmount;

            maker[QUOTE].locked -= quoteAmount;
            maker[QUOTE].total -= quoteAmount;
            maker[market].total += fill.qty;
        }
    }
}