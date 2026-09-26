import { wsClientMessageSchema } from "@repo/common";
import { WebSocketServer, WebSocket } from "ws";
import { subscriber } from "./redis";
import { PORT } from "./env";

const wss = new WebSocketServer({
    port: PORT
});

const subscriptions = new Map<string, Set<WebSocket>>();

wss.on("connection", (socket) => {
    socket.on("message", (data) => {
        let message;
        try {
            message = JSON.parse(data.toString());
        } catch {
            socket.close();
            return;
        }
        const parsed = wsClientMessageSchema.safeParse(message);

        if (!parsed.success) {
            socket.close();
            return;
        }

        if (parsed.data.method === "SUBSCRIBE") {
            parsed.data.params.forEach((param) => {
                let sockets = subscriptions.get(param);

                if (!sockets) {
                    sockets = new Set();
                    subscriptions.set(param, sockets);
                }

                sockets.add(socket); //Set is an object/reference type, once the Set is inside the Map, modifying that same Set automatically changes what the Map points to
            })
        } else if (parsed.data.method === "UNSUBSCRIBE") {
            parsed.data.params.forEach((param) => {
                const sockets = subscriptions.get(param);

                if (!sockets) {
                    return;
                }

                sockets.delete(socket);

                if (sockets.size === 0) {
                    subscriptions.delete(param);
                }
            })
        }

    })

    socket.on("close", () => {
        for (const [channel, sockets] of subscriptions) {
            sockets.delete(socket);
            if (sockets.size === 0) {
                subscriptions.delete(channel);
            }
        }
    })

    socket.on("error", console.error);
})

function broadcast(message: string, channel: string) {
    const sockets = subscriptions.get(channel);

    if (!sockets) {
        return;
    }
    
    sockets.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) { // a socket can be mid-close while you're iterating which throws on .send()
            socket.send(message);
        }
    })
}

await subscriber.pSubscribe("depth.*", broadcast); // pSubscribe = pattern subscribe. broadcast function is called once per published message
await subscriber.pSubscribe("trade.*", broadcast);