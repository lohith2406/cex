"use client";

import { useTrades } from "@/queries/useTrades";
import type { OrderSide } from "@repo/common";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";


function Row({ price, qty, time, side }: { price: number, qty: number, time: string, side: OrderSide }) {
    return (
        <div className="grid grid-cols-3 px-2 py-0.75 text-xs tabular-nums">
            <span className={side === "BUY" ? "text-up" : "text-down"}>{price}</span>
            <span className="text-right">{qty}</span>
            <span className="text-right">{time}</span>
        </div>
    )
}

export function Trades() {
    const { data: trades, isPending, isError, refetch } = useTrades();

    if (isPending) return <LoadingState />;
    if (isError) return <ErrorState onRetry={refetch}>Couldn&apos;t load the trades</ErrorState>;
    if (trades.length === 0) return <div className="p-3 text-sm text-muted-foreground">No trades</div>; 

    return (
        <div className="w-full bg-card py-2">
            <div className="grid grid-cols-3 border-b px-2 pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Price (USD)</span>
                <span className="text-right">Qty (BTC)</span>
                <span className="text-right">Time</span>
            </div>

            {trades.map((trade) => (
                <Row
                    key={trade.id}
                    price={trade.price}
                    qty={trade.qty}
                    time={new Date(trade.timestamp).toLocaleTimeString([], { hour12: false })}
                    side={trade.takerSide}
                />
            ))}
        </div>
    )
}