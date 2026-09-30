"use client";

import { Button } from "./ui/button";
import Link from "next/link";
import { Depth } from "@repo/common";
import { useAuth } from "@/context/AuthContext";
import { useDepth } from "@/queries/useDepth";

export function Header() {
    const { email, signOut } = useAuth();
    const { data: depth } = useDepth();

    return (
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-4">
                <span className="font-semibold text-neutral-100">Exchange</span>
                <span className="text-sm text-dim">BTC / USD</span>
                <span className="text-sm tabular-nums text-neutral-100">{depth?.lastTradedPrice ?? "-"}</span>
            </div>

            { email ? (
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-dim">{email}</span>
                    <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
                </div>
            ) : (
                <Button variant="outline" asChild size="sm">
                    <Link href="/signin">Sign in</Link>
                </Button>
            )}
        </header>
    )
}