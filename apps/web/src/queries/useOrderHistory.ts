import { useQuery } from "@tanstack/react-query";
import { useUser } from "./useUser";
import type { Order } from "@repo/common";
import { api } from "@/lib/api";

export function useOrderHistory() {
    const { data: user } = useUser();

    return useQuery({
        queryKey: ["orderHistory", user?.email],
        queryFn: async () => {
            const response = await api.get<{ data: Order[] }>("/orders");
            return response.data.data;
        },
        enabled: Boolean(user)
    });
}