import express from "express";
import { auth } from "./middleware/auth";
import { signup } from "./routes/signup";
import { signin } from "./routes/signin";
import { createOrder } from "./routes/create-order";
import { addBalance } from "./routes/add-balance";
import { getBalances } from "./routes/get-balance";
import { cancelOrder } from "./routes/cancel-order";
import { getDepth } from "./routes/get-depth";
import { getOrder } from "./routes/get-order";
import { getOrders } from "./routes/get-orders";
import { getFills } from "./routes/get-fills";
import { getTrades } from "./routes/get-trades";
import { getUser } from "./routes/get-user";
import { getKlines } from "./routes/get-klines";

const app = express();

app.use(express.json());

app.post("/api/v1/signup", signup);

app.post("/api/v1/signin", signin);

app.get("/api/v1/profile", auth, getUser)

app.post("/api/v1/orders", auth, createOrder);

app.get("/api/v1/orders/:orderId", auth, getOrder);

app.get("/api/v1/trades", getTrades);

app.delete("/api/v1/orders/:orderId", auth, cancelOrder);

app.get("/api/v1/depth", getDepth);

app.get("/api/v1/orders", auth, getOrders);

app.get("/api/v1/fills", auth, getFills);

app.get("/api/v1/balance", auth, getBalances);

app.post("/api/v1/balance/deposit", auth, addBalance);

app.get("/api/v1/klines", getKlines);


app.listen(4000, () => { console.log(`server running on 4000`) });