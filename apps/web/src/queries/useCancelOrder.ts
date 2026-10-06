import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCancelOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderId: string) => {
            await api.delete(`/orders/${orderId}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["openOrders"] });
            queryClient.invalidateQueries({ queryKey: ["balance"] });
            queryClient.invalidateQueries({ queryKey: ["orderHistory"] });
        }
    })
}