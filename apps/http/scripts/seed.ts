/*
 * Seeds a running stack with a believable BTC market: a handful of trades, so
 * there is a last price, recent trades and candles to look at, then resting
 * orders on both sides of the book.
 *
 * Goes through the public API rather than writing to Redis or Postgres, so it
 * exercises the same path the frontend does. Needs http, engine, db-worker and
 * Redis running.
 *
 * The engine keeps its book in memory, so run this again whenever the engine
 * starts without a snapshot. Running it twice against the same engine stacks a
 * second copy of every resting order.
 *
 * Run: bun run seed   (from apps/http)
 */

const API = process.env.SEED_API_URL ?? "http://localhost:4000/api/v1";
const MARKET = "BTC";
const PASSWORD = "seedpassword";

async function post(path: string, body: unknown, token?: string) {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
}

async function user(email: string): Promise<string> {
    const signup = await post("/signup", { email, password: PASSWORD });

    // 403 means the user exists from a previous run, which is fine
    if (signup.status !== 201 && signup.status !== 403) {
        throw new Error(`signup ${email}: ${signup.status} ${JSON.stringify(signup.json)}`);
    }

    const { status, json } = await post("/signin", { email, password: PASSWORD });

    if (status !== 200 || typeof json !== "object" || json === null ||
        !("token" in json) || typeof json.token !== "string") {
        throw new Error(`signin ${email}: ${status} ${JSON.stringify(json)}`);
    }

    return json.token;
}

async function deposit(token: string, asset: string, amount: number) {
    const res = await post("/balance/deposit", { asset, amount }, token);
    if (res.status !== 200) {
        throw new Error(`deposit ${amount} ${asset}: ${res.status} ${JSON.stringify(res.json)}`);
    }
}

async function order(token: string, side: "BUY" | "SELL", price: number, qty: number) {
    const res = await post("/orders", { market: MARKET, side, orderType: "LIMIT", price, qty }, token);
    if (res.status !== 201) {
        throw new Error(`${side} ${qty} @ ${price}: ${res.status} ${JSON.stringify(res.json)}`);
    }
}

const buyer = await user("buyer@seed.local");
const seller = await user("seller@seed.local");

await deposit(buyer, "USD", 10_000_000);
await deposit(seller, MARKET, 10_000);

// each pair is two orders at the same price and size, so it fills completely and
// leaves nothing behind. whoever goes second crosses the spread and is the
// taker, which is what the trade tape colours by. the last one sets
// lastTradedPrice.
const trades: [price: number, qty: number, taker: "BUY" | "SELL"][] = [
    [100, 2, "BUY"], [101, 1, "BUY"], [99, 3, "SELL"], [100, 4, "BUY"],
    [102, 1, "BUY"], [101, 2, "SELL"], [100, 2, "SELL"],
];

for (const [price, qty, taker] of trades) {
    if (taker === "BUY") {
        await order(seller, "SELL", price, qty);   // rests
        await order(buyer, "BUY", price, qty);     // crosses
    } else {
        await order(buyer, "BUY", price, qty);     // rests
        await order(seller, "SELL", price, qty);   // crosses
    }
}

// resting book either side of the last price. nothing here crosses.
for (let i = 1; i <= 8; i++) {
    await order(buyer, "BUY", 100 - i, i + 2);
    await order(seller, "SELL", 100 + i, 11 - i);
}

console.log(`seeded ${MARKET}: ${trades.length} trades, 8 bid levels (92-99), 8 ask levels (101-108)`);
