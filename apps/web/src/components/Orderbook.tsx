"use client";

import { useDepth } from "@/queries/useDepth";

function Row({ price, qty, cumulative, side, maxCumulative }: { price: number, qty: number, cumulative: number, side: "bid" | "ask", maxCumulative: number }) {
    return (
        <div className="relative grid grid-cols-3 px-2 py-0.75 text-xs tabular-nums">
            <div className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-up/13" : "bg-down/13"}`} // inset-y-0 = top-0 bottom-0
                style={{ width: `${(cumulative / maxCumulative) * 100}%` }}
            />
            <span className={`relative ${side === "bid" ? "text-up" : "text-down"}`}>{price}</span>
            <span className="relative text-right text-neutral-300">{qty}</span>
            <span className="relative text-right text-dim">{cumulative}</span>
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
    // const [depth, setDepth] = useState<Depth>(emptyDepth)

    // useEffect(() => {
    //     api.get<{ data: Depth }>("/depth?market=BTC")
    //         .then((response) => setDepth(response.data.data))
    // }, []);

    const { data: depth, isPending, isError } = useDepth()

    if (isPending) return <div className="p-3 text-sm text-dim">Loading order book…</div>;
    if (isError) return <div className="p-3 text-sm text-down">Couldn&apos;t load the order book</div>;

    const bids = withCumulative(depth.bids);
    const asks = withCumulative(depth.asks);
    const bestAsk = asks[0]?.price;
    const bestBid = bids[0]?.price
    const spread = bestAsk !== undefined && bestBid !== undefined ? bestAsk - bestBid : null;    
    const spreadPercent = spread !== null && bestBid !== undefined ? ((spread / bestBid) * 100).toFixed(2) : null;

    const maxCumulative = Math.max(bids.at(-1)?.cumulative ?? 0, asks.at(-1)?.cumulative ?? 0, 1);

    return (
        <div className="flex flex-col h-full w-full bg-panel py-2">

            <div className="grid grid-cols-3 border-b border-line px-2 pb-1.5 text-[11px] uppercase tracking-wide text-dim">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
            </div>

            <div className="flex flex-1 flex-col justify-end">
                {asks.toReversed().map((ask) => <Row key={ask.price} price={ask.price} qty={ask.qty} cumulative={ask.cumulative} side="ask" maxCumulative={maxCumulative} />)}
            </div>


            <div className="flex items-center justify-between border-y border-line bg-white/3 px-2 py-2 tabular-nums">
                <span className="text-lg">{depth.lastTradedPrice ?? "-"}</span>
                <span className="text-sm text-dim">${spread ?? "-"} ({spreadPercent ?? "-"}%)</span>
            </div>
            
            <div className="flex-1">
                {bids.map((bid) => <Row key={bid.price} price={bid.price} qty={bid.qty} cumulative={bid.cumulative} side="bid" maxCumulative={maxCumulative} />)}
            </div>
        </div>
    );
}