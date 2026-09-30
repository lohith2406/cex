"use client";

import { api } from "@/lib/api";
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
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        api.get<{ data: Trade[] }>("/trades?market=BTC&limit=50")
            .then((response) => setTrades(response.data.data))

    }, []);
    return (
        <div className="w-full bg-panel py-2">
            <div className="grid grid-cols-3 border-b border-line px-2 pb-1.5 text-[11px] uppercase tracking-wide text-dim">
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