"use client";

import type { OrderSide, Trade } from "@repo/common";
import axios from "axios"
import { useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function Row({ price, qty, time, side }: { price: number, qty: number, time: string, side: OrderSide }) {
    return (
        <div className="grid grid-cols-3 px-2 py-0.75 text-xs tabular-nums">
            <span className={side === "BUY" ? "text-emerald-400" : "text-rose-400"}>{price}</span>
            <span className="text-right">{qty}</span>
            <span className="text-right">{time}</span>
        </div>
    )
}

export function Trades() {
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        axios.get<{ data: Trade[] }>(`${API_URL}/trades?market=BTC&limit=50`)
            .then((response) => setTrades(response.data.data))

    }, []);
    return (
        <div className="w-64 bg-neutral-950 py-2 font-mono">
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