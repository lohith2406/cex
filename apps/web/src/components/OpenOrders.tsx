"use client";

import { useOpenOrders } from "@/queries/useOpenOrders";
import { useUser } from "@/queries/useUser";
import { Order, OrderSide } from "@repo/common";
import { Button } from "./ui/button";
import { useCancelOrder } from "@/queries/useCancelOrder";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

function Row({ order, cancel }: { order: Order, cancel: () => void }) {
    return (
        <div className="grid grid-cols-4 px-3 py-1 text-xs tabular-nums">
            <span className={order.side === "BUY" ? "text-up" : "text-down"}>{order.side}</span>
            <span className="text-right">{order.price}</span>
            <span className="text-right">{order.filledQty}/{order.qty}</span>
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
                    order={openOrder}
                    cancel={() => cancel(openOrder.orderId)}
                />
            ))}
        </div>
    )
}