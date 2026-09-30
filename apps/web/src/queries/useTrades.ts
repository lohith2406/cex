import { api } from "@/lib/api";
import { Trade } from "@repo/common";
import { useQuery } from "@tanstack/react-query";

export function useTrades() {
    return useQuery({
        queryKey: ["trades", "BTC"],
        queryFn: async () => {
            const response = await api.get<{ data: Trade[] }>("/trades?market=BTC");
            return response.data.data;
        }
    })
};