"use client";

import { Button } from "./ui/button";
import Link from "next/link";
import { useDepth } from "@/queries/useDepth";
import { useUser, useSignOut } from "@/queries/useUser";

export function Header() {
    const { data: user } = useUser();
    const signOut = useSignOut();
    const { data: depth } = useDepth();

    return (
        <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-4">
                <span className="font-semibold text-foreground">Exchange</span>
                <span className="text-sm text-muted-foreground">BTC / USD</span>
                <span className="text-sm tabular-nums text-foreground">{depth?.lastTradedPrice ?? "-"}</span>
            </div>

            {user && (
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{user.email}</span>
                    <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
                </div>
            )}
            {user === null && (
                <Button variant="outline" asChild size="sm">
                    <Link href="/signin">Sign in</Link>
                </Button>
            )}
        </header>
    )
}