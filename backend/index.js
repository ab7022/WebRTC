"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let senderSocket = null;
let receiverSocket = null;
wss.on("connection", (ws) => {
    ws.on("message", (data) => {
        const message = JSON.parse(data);
        if (message.type === "sender") {
            senderSocket = ws;
        }
        else if (message.type === "receiver") {
            receiverSocket = ws;
        }
        else if (message.type === "createOffer") {
            receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }));
        }
        else if (message.type === "createAnswer") {
            senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp }));
        }
        else if (message.type === "iceCandidate") {
            const targetSocket = ws === senderSocket ? receiverSocket : senderSocket;
            targetSocket === null || targetSocket === void 0 ? void 0 : targetSocket.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
        }
    });
});
