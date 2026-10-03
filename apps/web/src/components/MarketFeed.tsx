"use client";

import { Trade } from "@repo/common";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

export function MarketFeed() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            socket.send(JSON.stringify({ method: "SUBSCRIBE", params: ["depth.BTC", "trade.BTC"] }));
        };

        socket.onmessage = (event) => {
            const { channel, data } = JSON.parse(event.data);

            if (channel === "depth.BTC") {
                queryClient.setQueryData(["depth", "BTC"], data);
            }

            if (channel === "trade.BTC") {
                queryClient.setQueryData<Trade[]>(["trades", "BTC"], (old) => old ? [data, ...old].slice(0, 50): old);
                queryClient.invalidateQueries({ queryKey: ["balance"] });
                queryClient.invalidateQueries({ queryKey: ["openOrders"] });
            }

        };

        return () => {
            socket.close();
        }
    }, [queryClient]);

    return null;

}