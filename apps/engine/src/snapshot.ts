import fs from "fs/promises";
import type { OrderBookSnapshot } from "./store/orderbook";
import type { BalanceSnapshot } from "./store/balance";

export const SNAPSHOT_PATH = "./snapshots/engine.json";

type EngineSnapshot = {
    orderbook: OrderBookSnapshot;
    balances: BalanceSnapshot
};

export async function save(path: string, snapshot: EngineSnapshot) {
    const tmp = `${path}.tmp`;
    const final = `${path}`;
    await fs.writeFile(tmp, JSON.stringify(snapshot), "utf-8"); // in case of crash, engine.json is never touched
    await fs.rename(tmp, final); // renames are atomic
}

export async function load(path: string) {
    try {
        const data = await fs.readFile(path, "utf-8");
        return JSON.parse(data)
    } catch {
        return null
    }
}
