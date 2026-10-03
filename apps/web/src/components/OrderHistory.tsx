"use client";

import { useOrderHistory } from "@/queries/useOrderHistory";
import { useUser } from "@/queries/useUser";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { Order } from "@repo/common";

function Row({ order }: { order: Order }) {
    return (
        <div className="grid grid-cols-5 px-3 py-1 text-xs tabular-nums">
            <span>{new Date(order.createdAt).toLocaleString()}</span>
            <span className={order.side === "BUY" ? "text-up" : "text-down"}>{order.side}</span>
            <span className="text-right">{order.price}</span>
            <span className="text-right">{order.filledQty}/{order.qty}</span>
            <span className="text-right">{order.status}</span>
        </div>
    )
}

export function OrderHistory() {
    const { data: user } = useUser();
    const { data: orders, isPending, isError, refetch } = useOrderHistory();

    if (user === null) return <div className="p-3 text-sm text-muted-foreground">Sign in to see your order history</div>;
    if (isPending) return <LoadingState />;
    if (isError) return <ErrorState onRetry={refetch}>Couldn&apos;t load your order history</ErrorState>;
    if (orders.length === 0) return <div className="p-3 text-sm text-muted-foreground">No past orders</div>;

    return (
        <div>
            <div className="grid grid-cols-5 border-b px-3 pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Time</span>
                <span>Side</span>
                <span className="text-right">Price</span>
                <span className="text-right">Filled / Quantity</span>
                <span className="text-right">Status</span>
            </div>
            
            {orders.map((order) => (
                <Row key={order.orderId} order={order} />
            ))}
    </div>
    )
}