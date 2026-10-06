import { api } from "@/lib/api";
import type { OrderSide } from "@repo/common";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usePlaceOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ side, price, qty }: { side: OrderSide; price: number; qty: number }) => {
            await api.post("/orders", {
                market: "BTC",
                side,
                orderType: "LIMIT",
                price,
                qty
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["balance"] });
            queryClient.invalidateQueries({ queryKey: ["openOrders"] });

        }
    })
}