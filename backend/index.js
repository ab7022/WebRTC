"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let peers = [];
wss.on('connection', function connection(ws) {
    console.log('New connection established'); // Log new connection
    ws.on('error', (error) => {
        console.error('WebSocket error:', error); // Log WebSocket errors
    });
    ws.on('message', function message(data) {
        console.log('Received message:', data); // Log received message
        const message = JSON.parse(data);
        console.log('Parsed message:', message); // Log parsed message
        if (message.type === 'join') {
            console.log('Peer join message received'); // Log join message detection
            // First peer becomes the initiator
            const isInitiator = peers.length === 0;
            console.log('Is initiator:', isInitiator); // Log initiator status
            peers.push(ws); // Add peer to the list
            console.log('Updated peers list:', peers); // Log updated peers list
            // Tell the peer its role
            ws.send(JSON.stringify({
                type: 'role',
                isInitiator
            }));
        }
        else {
            console.log('Forwarding message to other peer'); // Log message forwarding
            // Forward all other messages to the other peer
            const otherPeer = peers.find(peer => peer !== ws);
            if (otherPeer) {
                console.log('Sending to other peer:'); // Log sending to other peer
                otherPeer.send(data);
            }
            else {
                console.log('No other peer found, dropping message'); // Log if no peer exists
            }
        }
    });
    ws.on('close', () => {
        console.log('Peer disconnected'); // Log peer disconnection
        peers = peers.filter(peer => peer !== ws); // Remove disconnected peer
        console.log('Updated peers list:', peers); // Log updated peers list
    });
});
console.log('WebRTC signaling server running on port 8080'); // Indicate server is running
