
import { useQuery } from "@tanstack/react-query";
import { useUser } from "./useUser";
import { api } from "@/lib/api";
import { Order } from "@repo/common";

export function useOpenOrders() {
    const { data: user } = useUser();

    return useQuery({
        queryKey: ["openOrders", user?.email],
        queryFn: async () => {
            const response = await api.get<{ data: Order[] }>("/orders/open");
            return response.data.data;
        },
        enabled: Boolean(user)
    });
}