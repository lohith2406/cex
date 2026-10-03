"use client";

import type { IChartApi, ISeriesApi} from "lightweight-charts";
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";
import { useKlines } from "@/queries/useKlines";

export function Chart() {
    const boxRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const fittedRef = useRef(false);
    const { data: candles } = useKlines();

    // create chart
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

        chartRef.current = chart;
        seriesRef.current = series;

        return () => {
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        }
    }, [])

    // update candles whenever they change
    useEffect(() => {
        if (!candles || !seriesRef.current) {
            return;
        }

        seriesRef.current.setData(candles.map((candle) => ({
            time: Math.floor(candle.timestamp / 1000) as UTCTimestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
        })));

        // zoom to fit only the first time, so live updates don't undo zoom
        if (!fittedRef.current) {
            chartRef.current?.timeScale().fitContent();
            fittedRef.current = true;
        }

    }, [candles]);

    return (
        <div ref={boxRef} className="h-full w-full"></div>
    )
}