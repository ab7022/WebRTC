import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
let senderSocket: import("ws") | null = null;
let receiverSocket: import("ws") | null = null;

wss.on("connection", (ws) => {
  ws.on("message", (data:any) => {
    const message = JSON.parse(data);

    if (message.type === "sender") {
      senderSocket = ws;
    } else if (message.type === "receiver") {
      receiverSocket = ws;
    } else if (message.type === "createOffer") {
      receiverSocket?.send(
        JSON.stringify({ type: "createOffer", sdp: message.sdp })
      );
    } else if (message.type === "createAnswer") {
      senderSocket?.send(
        JSON.stringify({ type: "createAnswer", sdp: message.sdp })
      );
    } else if (message.type === "iceCandidate") {
      const targetSocket = ws === senderSocket ? receiverSocket : senderSocket;
      targetSocket?.send(
        JSON.stringify({ type: "iceCandidate", candidate: message.candidate })
      );
    }
  });
});
