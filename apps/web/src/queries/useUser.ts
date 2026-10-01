"use client";

import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type User = { id: string; email: string };

export function useUser() {
    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            if (!localStorage.getItem("token")) {
                return null
            }
            const response = await api.get<{ data: User }>("/user");
            return response.data.data;
        }
    });
}

export function useSignIn() {
    const queryClient = useQueryClient();
    return (token: string) => {
        localStorage.setItem("token", token);
        queryClient.resetQueries({ queryKey: ["user"] }); // invalidateQueries = show old answer while loading. reset = throw old answer and ask again
    }
}

export function useSignOut() {
    const queryClient = useQueryClient();
    return () => {
        localStorage.removeItem("token");
        queryClient.resetQueries({ queryKey: ["user"] });
    }
}
