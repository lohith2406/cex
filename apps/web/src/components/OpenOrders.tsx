"use client";

import { useOpenOrders } from "@/queries/useOpenOrders";
import { useUser } from "@/queries/useUser";
import { OrderSide } from "@repo/common";
import { Button } from "./ui/button";
import { useCancelOrder } from "@/queries/useCancelOrder";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

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

export function Row({ side, price, qty, filledQty, cancel }: { side: OrderSide, price: number, qty: number, filledQty: number, cancel: () => void }) {
    return (
        <div className="grid grid-cols-4 px-3 py-1 text-xs tabular-nums">
            <span className={side === "BUY" ? "text-up" : "text-down"}>{side}</span>
            <span className="text-right">{price}</span>
            <span className="text-right">{filledQty}/{qty}</span>
            <Button variant="ghost" size="xs" onClick={cancel}>Cancel</Button>
        </div>
    )
}

export function OpenOrders() {
    const { data: user } = useUser();
    const { data: openOrders, isPending, isError, refetch } = useOpenOrders();
    const cancel = useCancelOrder();

    if (user === null) return <div className="p-3 text-sm text-muted-foreground">Sign in to see your open orders</div>;
    if (isPending) return <LoadingState />;
    if (isError) return <ErrorState onRetry={refetch}>Couldn&apos;t load your open orders</ErrorState>;
    if (openOrders.length === 0) return <div className="p-3 text-sm text-muted-foreground">No open orders</div>;

    return (
        <div>
            <div className="grid grid-cols-4 border-b px-3 pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Side</span>
                <span className="text-right">Price</span>
                <span className="text-right">Filled / Quantity</span>
            </div>
            {openOrders.map((openOrder) => (
                <Row 
                    key={openOrder.orderId}
                    side={openOrder.side} 
                    price={openOrder.price} 
                    qty={openOrder.qty} 
                    filledQty={openOrder.filledQty}
                    cancel={() => cancel(openOrder.orderId)}
                />
            ))}
        </div>
    )
}