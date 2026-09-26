# cex

A centralized spot exchange. Orders are matched in memory by a single process; everything
else in the system exists to feed that process or to fan out what it produces.

Built with TypeScript on Bun, in a Turborepo monorepo. Redis for transport, Postgres for
the durable record.

## Why it is shaped this way

An exchange has one hard constraint: two orders must never match against the same
liquidity. The usual answers are locks or transactions. This one takes the other route,
matching runs in a single process with all state in RAM and no `await` anywhere in the
critical section. The event loop cannot interleave two placements, so atomicity is a
property of the code's shape rather than something enforced at runtime.

That decision is what forces the rest of the architecture. The engine cannot touch
Postgres, because an `await` in the matching path would reintroduce the interleaving the
design exists to prevent. So persistence moves out to a worker, market data moves out to a
WebSocket service, and the HTTP layer never calls the engine directly.

## Services

| service | what it does |
| --- | --- |
| `apps/http` | REST API and auth. Validates, forwards to the engine, waits for a reply. |
| `apps/engine` | Matching, balances, the order book. Single process, all state in RAM. |
| `apps/db-worker` | Drains engine events into Postgres. |
| `apps/ws` | Fans depth and trades out to browser clients. |
| `packages/common` | Zod schemas shared by every service. The wire protocol lives here. |
| `packages/db` | Prisma schema and client. |
| `packages/redis` | Connection factory. |
| `packages/auth` | JWT middleware. |

## Transport

Three links between services, three different Redis primitives. The choice on each one
comes from a single question: what breaks if a message is lost?

```
                 ┌──────────┐
  client ──HTTP──►   http   │
         ◄────────└────┬─────┘
                       │
       LPUSH engine:requests        list, because exactly one engine must
       SUBSCRIBE reply:<reqId>      take each order, and the reply has to
                       │            find the one client that is waiting
                 ┌─────▼─────┐
                 │  engine   │
                 └──┬─────┬──┘
                    │     │
  XADD engine:events│     │ PUBLISH depth.<market>
  stream + consumer │     │ PUBLISH trade.<market>
  group, because a  │     │ pub/sub, because a dropped
  lost fill is a    │     │ depth update is replaced by
  lost trade        │     │ the next one, and the engine
                    │     │ must not care who is listening
              ┌─────▼──┐  └──►┌──────┐
              │db-worker│     │  ws  │
              └────┬────┘     └───┬──┘
                   │              │
               Postgres        browsers
```

A list gives addressing but no durability. A stream gives durability and replay but no
per-request routing. Pub/sub gives broadcast but drops anything nobody is listening for.
None of the three is better than the others; each leg needs a different one.

Delivery on the stream is at-least-once, so the worker's writes are idempotent: Prisma
upserts keyed by engine-supplied ids. `XAUTOCLAIM` picks up messages stranded by a worker
that died mid-batch.

## Engine internals

- **Order book** is `Level[]` sorted by price, each level holding orders in arrival order.
  Price-time priority falls out of that: best price is index 0, oldest order is index 0
  within the level. Arrays rather than a keyed object, because JavaScript reorders
  integer-like keys ascending and would silently break bid ordering.
- **Balances** lock funds at placement and settle on fill. A taker whose order crosses a
  maker at a better price is refunded the difference.
- **Snapshots** of the full engine state are written every 5 seconds to a temp file and
  then `rename`d, which is atomic, so a crash mid-write cannot corrupt the last good
  snapshot.

## Benchmark

`bun run bench` in `apps/engine`. Measures `placeOrder` alone: no Redis, no Postgres, no
JSON. Orders are built before the clock starts, a 20k warmup pass runs first, and
latencies land in a preallocated array.

200,000 orders per scenario, M-series Mac, Bun 1.3:

| scenario | orders/sec | p50 | p99 | p99.9 |
| --- | --- | --- | --- | --- |
| resting order, no match | 821,571 | 1.04 us | 3.33 us | 7.04 us |
| taker filled by one maker | 1,374,485 | 0.58 us | 2.12 us | 8.29 us |
| taker sweeping 10 makers | 198,162 | 4.29 us | 19.67 us | 46.88 us |

Resting is the slowest of the three because it scans to find its price level; filling only
consumes from the front. The sweep row is 198k takers/sec, which is ~2M fills/sec.

## Known limits

Listed because they are real, not because they are planned away.

- **Insert is O(price levels),** because resting an order linear-scans the sorted level
  array. The harness measures it:

  ```
    1000 levels      2.04 us/insert
    2000 levels      4.36 us/insert
    4000 levels      8.79 us/insert
    8000 levels     17.79 us/insert
   16000 levels     36.63 us/insert
  ```

  Bounded in practice by tick size and by liquidity clustering near the mid, but orders at
  unique prices widen the book and slow everything after them. Fix is a price-keyed map for
  lookup beside the sorted array for ordering.
- **Tail latency is garbage collection.** p99.9 sits under 12us while max swings into
  milliseconds. An `Order` and a `Fill` are allocated per operation; pooling them would cut
  it.
- **Orders are never evicted.** Filled and cancelled orders stay in the engine's map
  forever and are written into every snapshot.
- **Snapshot without replay.** Restarting rewinds the engine up to 5 seconds, while
  Postgres still holds the trades from that window. The fix is replaying the stream from
  the snapshot's position, which needs `MINID` trimming so nothing replay depends on is
  discarded.
- **Depth is sent in full, not as deltas, and is not throttled.** Every order publishes the
  whole book for its market.
- **No WebSocket heartbeat.** A client whose network drops without closing leaves a socket
  in the registry.

## WebSocket protocol

```json
{ "method": "SUBSCRIBE", "params": ["depth.BTC", "trade.BTC"] }
```

Channel names are the same strings the engine publishes to, so adding a market needs no
change in the WebSocket service.

## Running it

Needs Redis and Postgres. Each service reads its own `.env`: `REDIS_URL` everywhere,
`DATABASE_URL` for http and db-worker, plus `JWT_SECRET` for http and `PORT` for ws.

```sh
bun install
cd packages/db && bunx prisma migrate dev && bunx prisma generate

bun run dev                          # all services
bun test                             # engine unit tests
cd apps/engine && bun run bench      # the numbers above
```

## Not built yet

Perpetual futures, the trading frontend (`apps/web` is still the Turborepo starter), and
klines.
