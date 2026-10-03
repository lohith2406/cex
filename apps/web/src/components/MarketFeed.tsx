"use client";

import { Candle, Trade } from "@repo/common";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

export function MarketFeed() {
    const queryClient = useQueryClient();

    useEffect(() => {
        let socket: WebSocket;
        let stopped = false;

        function connect() {
            if (stopped) return;

            socket = new WebSocket(WS_URL);
    
            socket.onopen = () => {
                socket.send(JSON.stringify({ method: "SUBSCRIBE", params: ["depth.BTC", "trade.BTC"] }));
                queryClient.invalidateQueries({ queryKey: ["depth"] });
                queryClient.invalidateQueries({ queryKey: ["trades"] });            
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
                    queryClient.invalidateQueries({ queryKey: ["orderHistory"] });
                    
                    queryClient.setQueryData<Candle[]>(["klines", "BTC", "1h"], (old) => {
                        if (!old) {
                            return old;
                        }
                        
                        const HOUR = 60 * 60 * 1000;
                        const hourStart = Math.floor(data.timestamp / HOUR) * HOUR;
                        const last = old.at(-1);

                        // same hour as last candle: stretch it
                        if (last && last.timestamp === hourStart) {
                            return [...old.slice(0, -1), {
                                ...last,
                                high: Math.max(last.high, data.price),
                                low: Math.min(last.low, data.price),
                                close: data.price,
                                volume: last.volume + data.qty
                            }]
                        }

                        // new hour: start a new candle
                        return [...old, {
                            timestamp: hourStart,
                            open: data.price,
                            high: data.price,
                            low: data.price,
                            close: data.price,
                            volume: data.qty
                        }];
                    })
                }

            }

            socket.onclose = () => {
                if (!stopped) {
                    setTimeout(connect, 2000);
                }
            }
            
        };

        connect();

        return () => {
            stopped = true;
            socket.close();
        }
    }, [queryClient]);

    return null;

}