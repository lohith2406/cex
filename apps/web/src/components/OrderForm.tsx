"use client";

import { api } from "@/lib/api";
import axios from "axios";
import { type SubmitEvent, useState } from "react";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { type OrderSide } from "@repo/common";

export function OrderForm() {
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
        <form onSubmit={handleSubmit} className="w-64 bg-neutral-950 p-3">
            <FieldGroup>
                <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={side === "BUY" ? "default" : "outline"} onClick={() => setSide("BUY")}>
                        Buy
                    </Button>
                    <Button type="button" variant={side === "SELL" ? "default" : "outline"} onClick={() => setSide("SELL")}>
                        Sell
                    </Button>
                </div>

                <Field>
                    <FieldLabel htmlFor="price">Price</FieldLabel>
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
                    <FieldLabel htmlFor="qty">Quantity</FieldLabel>
                    <Input 
                        id="qty" 
                        type="number" 
                        required
                        min={1}
                        step={1}
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                    />
                </Field>

                <Field>
                    <Button type="submit">{side === "BUY" ? "Buy" : "Sell"}</Button>
                    <FieldError>{error}</FieldError>
                </Field>
            </FieldGroup>
        </form>
    )
}