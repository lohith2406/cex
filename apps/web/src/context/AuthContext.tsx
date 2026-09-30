"use client";

import { api } from "@/lib/api";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type Auth = {
    email: string | null;
    signIn: (token: string) => Promise<void>;
    signOut: () => void;
};

export const AuthContext = createContext<Auth>({ email: null, signIn: async() => {}, signOut: () => {} });

export default function AuthProvider({ children }: { children: ReactNode}) {
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            return;
        }

        api.get<{ data: { email: string }}>("/me")
        .then((response) => setEmail(response.data.data.email));

    }, []);

    async function signIn(token: string) {
        localStorage.setItem("token", token);
        const response = await api.get<{ data: { email: string }}>("/me");
        setEmail(response.data.data.email);
    }

    function signOut() {
        localStorage.removeItem("token");
        setEmail(null);
    }

    return (
        <AuthContext value={{email, signIn, signOut}}>
            {children}
        </AuthContext>
    )
}

export function useAuth() {
    return useContext(AuthContext);
}