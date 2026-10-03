import { api } from "@/lib/api";
import { Candle } from "@repo/common";
import { useQuery } from "@tanstack/react-query";

export function useKlines() {
    return useQuery({
        queryKey: ["klines", "BTC", "1h"],
        queryFn: async () => {
            const response = await api.get<{ data: Candle[] }>("/klines?market=BTC&interval=1h");
            return response.data.data;
        }
    })
}