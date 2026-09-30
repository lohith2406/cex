"use client";

import { createContext, useContext, useState } from "react";

const CountContext = createContext(0);
function Show() {
    const count = useContext(CountContext);
    return <p>{count}</p>;
}

export default function() {
    const [count, setCount] = useState(0);

    return (
        <CountContext value={count}>
            <button onClick={() => setCount(count + 1)}>add</button>
            <Show></Show>
            <Show></Show>
        </CountContext>
    )
}