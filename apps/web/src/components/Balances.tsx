"use client";

import { useUser } from "@/queries/useUser";
import { useBalance } from "@/queries/useBalance";
import { useDepth } from "@/queries/useDepth";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { useDeposit } from "@/queries/useDeposit";
import { Button } from "./ui/button";

function Row({ asset, total, available, locked, value }: { asset: string, total: number, available: number, locked: number, value: number | null }) {
    return (
        <div className="grid grid-cols-5 px-3 py-1 text-xs tabular-nums">
            <span>{asset}</span>
            <span className="text-right">{total.toLocaleString()}</span>
            <span className="text-right">{available.toLocaleString()}</span>
            <span className="text-right">{locked.toLocaleString()}</span>
            <span className="text-right">{value?.toLocaleString() ?? "-"}</span>
        </div>
    )
}

export function Balances() {
    const { data: user } = useUser();
    const { data: balances, isPending, isError, refetch } = useBalance();
    const { data: depth } = useDepth();
    const deposit = useDeposit();

    if (user === null) return <div className="p-3 text-sm text-muted-foreground">Sign in to see your balances</div>;
    if (isPending) return <LoadingState />;
    if (isError) return <ErrorState onRetry={refetch}>Couldn&apos;t load your balances</ErrorState>;

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
            <div className="flex justify-end px-3 py-1.5">
                <Button variant="outline" size="xs" disabled={deposit.isPending} onClick={() => deposit.mutate()}>Get test funds</Button>
            </div>
            <div className="grid grid-cols-5 border-b px-3 pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Asset</span>
                <span className="text-right">Total</span>
                <span className="text-right">Available</span>
                <span className="text-right">In orders</span>
                <span className="text-right">Value (USD)</span>
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