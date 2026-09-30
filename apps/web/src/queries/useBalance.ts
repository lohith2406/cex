import { api } from "@/lib/api";
import { Asset } from "@repo/common";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "./useUser";

type Balances = Record<Asset, { total: number; locked: number }>;

export function useBalance() {
    const { data: user } = useUser();
    return useQuery({
        queryKey: ["balance", user?.email],
        queryFn: async () => {
            const response = await api.get<{ data: Balances }>("/balance");
            return response.data.data;
        },
        enabled: !!user
    })
}