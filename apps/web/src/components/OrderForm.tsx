"use client";

import { api } from "@/lib/api";
import axios from "axios";
import { type SubmitEvent, useState } from "react";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { type OrderSide } from "@repo/common";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useBalance } from "@/queries/useBalance";
import { useUser } from "@/queries/useUser";


export function OrderForm() {
    const [side, setSide] = useState<OrderSide>("BUY");
    const [price, setPrice] = useState("");
    const [qty, setQty] = useState("");
    const [error, setError] = useState("");
    const { data: balance } = useBalance();
    const { data: user } = useUser();
    const queryClient = useQueryClient();

    const asset = side === "BUY" ? "USD" : "BTC";
    const available = balance ? balance[asset].total - balance[asset].locked : null;

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        try {
            await api.post("/orders", {
                market: "BTC",
                side,
                orderType: "LIMIT",
                price: Number(price),
                qty: Number(qty)
            });
            setPrice("");
            setQty("");
            queryClient.invalidateQueries({ queryKey: ["depth"] });
            queryClient.invalidateQueries({ queryKey: ["trades"] });
            queryClient.invalidateQueries({ queryKey: ["balance"] });
            queryClient.invalidateQueries({ queryKey: ["openOrders"] });

        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data.error ?? "Something went wrong");
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full bg-card p-3">
            <FieldGroup>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant={side === "BUY" ? "default" : "outline"}
                        className={side === "BUY" ? "bg-up hover:bg-up/90" : ""}
                        onClick={() => setSide("BUY")}>
                        Buy
                    </Button>
                    <Button
                        type="button"
                        variant={side === "SELL" ? "default" : "outline"}
                        className={side === "SELL" ? "bg-down hover:bg-down/90" : ""}
                        onClick={() => setSide("SELL")}
                    >
                        Sell
                    </Button>
                </div>

                <Field>
                    <FieldLabel htmlFor="price">Price (USD)</FieldLabel>
                    <Input
                        id="price"
                        type="number"
                        required
                        min={1}
                        step={1}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="qty">Quantity (BTC)</FieldLabel>
                    <Input
                        id="qty"
                        type="number"
                        required
                        min={1}
                        step={1}
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                    />
                    { price && qty && (
                        <FieldDescription>Total: {(Number(price) * Number(qty)).toLocaleString()} USD</FieldDescription>
                    )}
                    {user &&
                        <FieldDescription>Available: {available?.toLocaleString() ?? "-"} {asset}</FieldDescription>
                    }
                </Field>

                <Field>
                    {user && (
                        <Button
                            type="submit"
                            className={side === "BUY" ? "bg-up hover:bg-up/90" : "bg-down hover:bg-down/90"}
                        >
                            {side === "BUY" ? "Buy BTC" : "Sell BTC"}
                        </Button>
                    )}
                    {user === null && (
                        <Button type="button" asChild>
                            <Link href="/signin">Sign in to trade</Link>
                        </Button>
                    )}
                    <FieldError>{error}</FieldError>
                </Field>
            </FieldGroup>
        </form>
    )
}