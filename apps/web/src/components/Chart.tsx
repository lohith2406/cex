"use client";

import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { Candle } from "@repo/common";
import { api } from "@/lib/api";

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
                    color: "#171717"
                },
                textColor: "#a1a1a1",
            },
            grid: {
                vertLines: {
                    color: "#262626"
                },
                horzLines: {
                    color: "#262626"
                }
            },
            rightPriceScale: {
                borderVisible: false
            },
            timeScale: {
                timeVisible: true,
                borderVisible: false
            }
        });
        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#3dd68c",
            downColor: "#f0616d",
            wickUpColor: "#3dd68c",
            wickDownColor: "#f0616d",
            borderVisible: false,
        });

        let cancelled = false;

        api.get<{ data: Candle[] }>("/klines?market=BTC&interval=1h")
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

                chart.timeScale().fitContent();
            })

        return () => {
            cancelled = true;
            chart.remove();
        }
    }, [])

    return (
        <div ref={boxRef} className="h-full w-full"></div>
    )
}