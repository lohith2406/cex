import express from "express";
import { auth } from "./middleware/auth";
import { signup } from "./routes/signup";
import { signin } from "./routes/signin";
import { createOrder } from "./routes/create-order";

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

app.delete("/order/:orderId", auth, () => {
    
});

app.get("/depth/:symbol", () => {
    
});

app.get("/orders", auth, () => {
    
});

app.get("/fills", auth, () => {
    
});

app.get("/balance", auth, () => {
    
});

app.get("/klines", () => {
    
});

app.post("/balance", auth, () => {
    
});


app.listen(3000, () => { console.log(`server running on 3000`) });