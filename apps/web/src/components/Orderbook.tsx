"use client";

import { useEffect, useState } from "react";
import type { Depth } from "@repo/common";
import { api } from "@/lib/api";

const emptyDepth: Depth = {
    bids: [],
    asks: [],
    lastTradedPrice: 0
};

function Row({ price, qty, cumulative, side, maxCumulative }: { price: number, qty: number, cumulative: number, side: "bid" | "ask", maxCumulative: number }) {
    return (
        <div className="relative grid grid-cols-3 px-2 py-0.75 text-xs tabular-nums">
            <div className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-emerald-500/10" : "bg-rose-500/10"}`} // inset-y-0 = top-0 bottom-0
                style={{ width: `${(cumulative / maxCumulative) * 100}%` }}
            />
            <span className={`relative ${side === "bid" ? "text-emerald-400" : "text-rose-400"}`}>{price}</span>
            <span className="relative text-right text-neutral-300">{qty}</span>
            <span className="relative text-right text-neutral-500">{cumulative}</span>
        </div>
    )
}

function withCumulative(levels: { price: number, qty: number }[]) {
    let running = 0;

    return levels.map((level) => {
        running += level.qty;
        return { ...level, cumulative: running };
    })
}

export function Orderbook() {
    const [depth, setDepth] = useState<Depth>(emptyDepth)

    useEffect(() => {
        api.get<{ data: Depth }>("/depth?market=BTC")
            .then((response) => setDepth(response.data.data))
    }, []);

    const bids = withCumulative(depth.bids);
    const asks = withCumulative(depth.asks);

    const maxCumulative = Math.max(bids.at(-1)?.cumulative ?? 0, asks.at(-1)?.cumulative ?? 0, 1);

    return (
        <div className="w-64 bg-neutral-950 py-2 font-mono">
            {asks.toReversed().map((ask) => <Row key={ask.price} price={ask.price} qty={ask.qty} cumulative={ask.cumulative} side="ask" maxCumulative={maxCumulative} />)}

            <div className="px-2 py-2 tabular-nums text-neutral-100">
                {depth.lastTradedPrice}
            </div>

            {bids.map((bid) => <Row key={bid.price} price={bid.price} qty={bid.qty} cumulative={bid.cumulative} side="bid" maxCumulative={maxCumulative} />)}
        </div>
    );
}