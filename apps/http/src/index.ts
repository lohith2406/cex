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

const app = express();

app.use(express.json());

app.post("/signup", signup);

app.post("/signin", signin);

app.get("/profile", auth, getUser)

app.post("/order", auth, createOrder);

app.get("/order/:orderId", auth, getOrder);

app.get("/trades/:market", getTrades);

app.delete("/order/:orderId", auth, cancelOrder);

app.get("/depth/:market", getDepth);

app.get("/orders", auth, getOrders);

app.get("/fills", auth, getFills);

app.get("/balance/", auth, getBalances);

app.get("/klines", () => {
    
});

app.post("/balance/deposit", auth, addBalance);


app.listen(4000, () => { console.log(`server running on 4000`) });