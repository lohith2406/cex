import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export function useCancelOrder() {
    const queryClient = useQueryClient();

    return async (orderId: string) => {
        try {
            await api.delete(`/orders/${orderId}`);
        } finally {
            queryClient.invalidateQueries({ queryKey: ["openOrders"] });
            queryClient.invalidateQueries({ queryKey: ["balance"] });
        }
    }
}