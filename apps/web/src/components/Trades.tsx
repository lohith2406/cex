"use client";

import { api } from "@/lib/api";
import { useTrades } from "@/queries/useTrades";
import type { OrderSide, Trade } from "@repo/common";
import { useEffect, useState } from "react"


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
    const { data: trades, isPending, isError } = useTrades();

    if (isPending) return <div className="p-3 text-sm text-muted-foreground">Loading trades</div>;
    if (isError) return <div className="p-3 text-sm text-down">Couldn&apos;t load the trades</div>;

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