"use client";

import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";
import axios from "axios";
import type { Candle } from "@repo/common";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function Chart() {
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const box = boxRef.current;
        if (!box) {
            return;
        }
        const chart = createChart(box, { 
            autoSize: true,
            layout: {
                background: {
                    type: ColorType.Solid, 
                    color: "#0a0a0a"
                },
                textColor: "#a3a3a3",
            },
            grid: {
                vertLines: {
                    color: "#171717"
                },
                horzLines: {
                    color: "#171717"
                }
            },
            timeScale: {
                timeVisible: true
            }
        });
        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#34d399",
            downColor: "#fb7185",
            wickUpColor: "#34d399",
            wickDownColor: "#fb7185",
            borderVisible: false,
        });

        let cancelled = false;

        axios.get<{ data: Candle[] }>(`${API_URL}/klines?market=BTC&interval=1h`)
            .then((response) => {
                if (cancelled) return;

                const candles = response.data.data.map((candle) => ({
                    time: Math.floor(candle.timestamp / 1000) as UTCTimestamp,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                }));

                series.setData(candles);
            })

        return () => {
            cancelled = true;
            chart.remove();
        }
    }, [])

    return (
        <div ref={boxRef} className="h-96 w-160"></div>
    )
}