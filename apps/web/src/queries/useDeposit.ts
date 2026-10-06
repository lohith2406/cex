import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeposit() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async () => {
            await api.post("/balance/deposit", { asset: "USD", amount: 10000 });
            await api.post("/balance/deposit", { asset: "BTC", amount: 100 });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["balance"] });
        }
    })
}