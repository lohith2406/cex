"use client";

import { useDepth } from "@/queries/useDepth";

function Row({ price, qty, cumulative, side, maxCumulative }: { price: number, qty: number, cumulative: number, side: "bid" | "ask", maxCumulative: number }) {
    return (
        <div className="relative grid grid-cols-3 px-2 py-0.75 text-xs tabular-nums">
            <div className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-up/13" : "bg-down/13"}`} // inset-y-0 = top-0 bottom-0
                style={{ width: `${(cumulative / maxCumulative) * 100}%` }}
            />
            <span className={`relative ${side === "bid" ? "text-up" : "text-down"}`}>{price}</span>
            <span className="relative text-right text-foreground">{qty}</span>
            <span className="relative text-right text-muted-foreground">{cumulative}</span>
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

    const { data: depth, isPending, isError } = useDepth()

    if (isPending) return <div className="p-3 text-sm text-muted-foreground">Loading order book…</div>;
    if (isError) return <div className="p-3 text-sm text-down">Couldn&apos;t load the order book</div>;

    const bids = withCumulative(depth.bids);
    const asks = withCumulative(depth.asks);
    const bestAsk = asks[0]?.price;
    const bestBid = bids[0]?.price
    const spread = bestAsk !== undefined && bestBid !== undefined ? bestAsk - bestBid : null;    
    const spreadPercent = spread !== null && bestBid !== undefined ? ((spread / bestBid) * 100).toFixed(2) : null;

    const maxCumulative = Math.max(bids.at(-1)?.cumulative ?? 0, asks.at(-1)?.cumulative ?? 0, 1);

    return (
        <div className="flex flex-col h-full w-full bg-card py-2">

            <div className="grid grid-cols-3 border-b px-2 pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
            </div>

            <div className="flex flex-1 flex-col justify-end">
                {asks.toReversed().map((ask) => <Row key={ask.price} price={ask.price} qty={ask.qty} cumulative={ask.cumulative} side="ask" maxCumulative={maxCumulative} />)}
            </div>


            <div className="flex items-center justify-between border-y bg-muted px-2 py-2 tabular-nums">
                <span className="text-lg">{depth.lastTradedPrice ?? "-"}</span>
                <span className="text-sm text-muted-foreground">${spread ?? "-"} ({spreadPercent ?? "-"}%)</span>
            </div>
            
            <div className="flex-1">
                {bids.map((bid) => <Row key={bid.price} price={bid.price} qty={bid.qty} cumulative={bid.cumulative} side="bid" maxCumulative={maxCumulative} />)}
            </div>
        </div>
    );
}