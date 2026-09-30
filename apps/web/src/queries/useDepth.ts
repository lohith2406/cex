import { api } from "@/lib/api";
import { Depth } from "@repo/common";
import { useQuery } from "@tanstack/react-query"

export function useDepth() {
    return useQuery({
        queryKey: ["depth", "BTC"],
        queryFn: async () => {
            const response = await api.get<{ data: Depth }>("/depth?market=BTC");
            return response.data.data;
        }
    });
}