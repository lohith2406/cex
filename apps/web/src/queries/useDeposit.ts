import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export function useDeposit() {
    const queryClient = useQueryClient();

    return async () => {
        try {
            await api.post("/balance/deposit", { asset: "USD", amount: 10000 });
            await api.post("/balance/deposit", { asset: "BTC", amount: 100 });
        } finally {
            queryClient.invalidateQueries({ queryKey: ["balance"] });
        }
    }
}