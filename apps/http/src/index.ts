import express from "express";
import { auth } from "./middleware/auth";
import { signup } from "./routes/signup";
import { signin } from "./routes/signin";
import { createOrder } from "./routes/create-order";
import { addBalance } from "./routes/add-balance";
import { getBalances } from "./routes/get-balance";
import { cancelOrder } from "./routes/cancel-order";

const app = express();

app.use(express.json());

app.post("/signup", signup);

app.post("/signin", signin);

app.get("/profile", auth, () => {
    
})

app.post("/order", auth, createOrder);

app.get("/order/:orderId", auth, () => {
    
});

app.get("/trades", () => {
    
});

app.delete("/order/:orderId", auth, cancelOrder);

app.get("/depth/:symbol", () => {
    
});

app.get("/orders", auth, () => {
    
});

app.get("/fills", auth, () => {
    
});

app.get("/balance/", auth, getBalances);

app.get("/klines", () => {
    
});

app.post("/balance/deposit", auth, addBalance);


app.listen(4000, () => { console.log(`server running on 4000`) });