"use client";

import { useUser } from "@/queries/useUser";
import { Asset } from "@repo/common";
import { Button } from "./ui/button";
import { useBalance } from "@/queries/useBalance";
import { useDepth } from "@/queries/useDepth";

// orderId: string;
// userId: string;
// market: "BTC" | "ETH" | "SOL";
// side: "BUY" | "SELL";
// orderType: "MARKET" | "LIMIT";
// price: number;
// qty: number;
// filledQty: number;
// status: "OPEN" | "FILLED" | "PARTIALLY_FILLED" | "CANCELLED" | "EXPIRED";
// createdAt: number;

export function Row({ asset, total, available, locked, value }: { asset: string, total: number, available: number, locked: number, value: number | null }) {
    return (
        <div className="grid grid-cols-5 px-3 py-1 text-sm tabular-nums">
            <span>{asset}</span>
            <span>{total.toLocaleString()}</span>
            <span>{available.toLocaleString()}</span>
            <span>{locked.toLocaleString()}</span>
            <span>{value?.toLocaleString()}</span>
        </div>
    )
}

export function Balances() {
    const { data: user } = useUser();
    const { data: balances, isPending, isError } = useBalance();
    const { data: depth } = useDepth();
    
    if (user === null) return <div className="p-3 text-sm text-muted-foreground">Sign in to see your balances</div>;
    if (isPending) return <div className="p-3 text-sm text-muted-foreground">Loading balances</div>;
    if (isError) return <div className="p-3 text-sm text-down">Couldn&apos;t load your balances</div>;

    const rows = Object.entries(balances).filter(([_asset, balance]) => balance.total > 0);
    if (rows.length === 0) return <div className="p-3 text-sm text-muted-foreground">No balances</div>;

    function valueInUsd(asset: string, total: number) {
        if (asset === "USD") {
            return total;
        }

        if (asset === "BTC" && depth?.lastTradedPrice != null) { // x != null => x !== null && x !== undefined
            return total * depth.lastTradedPrice
        }

        return null;
    }
    return (
        <div>
            <div className="grid grid-cols-5 border-b px-2 pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Asset</span>
                <span>Total</span>
                <span>Available</span>
                <span>In orders</span>
                <span>Value (USD)</span>
            </div>
            {rows.map(([asset, balance]) => (
                <Row 
                    key={asset}
                    asset={asset} 
                    total={balance.total} 
                    available={balance.total - balance.locked} 
                    locked={balance.locked}
                    value={valueInUsd(asset, balance.total)}
                />
            ))}
        </div>
    )
}