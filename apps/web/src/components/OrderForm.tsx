"use client";

import { api } from "@/lib/api";
import axios from "axios";
import { type SubmitEvent, useContext, useState } from "react";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { type OrderSide } from "@repo/common";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function OrderForm() {
    const { email } = useAuth();
    const [side, setSide] = useState<OrderSide>("BUY");
    const [price, setPrice] = useState("");
    const [qty, setQty] = useState("");
    const [error, setError] = useState("");

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

        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data.error ?? "Something went wrong");
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full bg-panel p-3">
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
                    <FieldDescription>Total = {Number(price) * Number(qty)} USD</FieldDescription>
                </Field>

                <Field>
                    { email ? (
                    <Button
                        type="submit"
                        className={side === "BUY" ? "bg-up hover:bg-up/90": "bg-down hover:bg-down/90"}
                    >
                        {side === "BUY" ? "Buy BTC" : "Sell BTC"}
                    </Button>
                    ) : (
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