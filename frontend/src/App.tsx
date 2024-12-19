import { useEffect, useRef, useState } from "react";

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isInitiatorRef = useRef(false);

  const setupPeerConnection = () => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Handle receiving remote tracks
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Send ICE candidates to peer
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.send(
          JSON.stringify({
            type: "iceCandidate",
            candidate: event.candidate,
          })
        );
      }
    };

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (localStreamRef.current) {
          peerConnectionRef.current?.addTrack(track, localStreamRef.current);
        }
      });
    }
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setupPeerConnection();

      if (isInitiatorRef.current && peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socketRef.current?.send(
          JSON.stringify({
            type: "offer",
            sdp: offer,
          })
        );
      }
    } catch (err) {
      console.error("Error getting user media:", err);
    }
  };

  useEffect(() => {
    socketRef.current = new WebSocket(
      "https://a833-2406-7400-10d-a70d-dcfd-a4a6-c5a1-91db.ngrok-free.app"
    );

    socketRef.current.onopen = () => {
      console.log("Connected to signaling server");
      socketRef.current?.send(JSON.stringify({ type: "join" }));
    };

    socketRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);
      
      try {
        switch (message.type) {
          case "role":
            isInitiatorRef.current = message.isInitiator;
            startLocalStream();
            break;

          case "offer":
            if (!peerConnectionRef.current) return;
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(message.sdp)
            );
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            socketRef.current?.send(
              JSON.stringify({
                type: "answer",
                sdp: answer,
              })
            );
            break;

          case "answer":
            if (!peerConnectionRef.current) return;
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(message.sdp)
            );
            setIsConnected(true);
            break;

          case "iceCandidate":
            if (!peerConnectionRef.current) return;
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(message.candidate)
            );
            break;

          default:
            console.warn("Unknown message type:", message.type);
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    };

    socketRef.current.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnectionRef.current?.close();
      socketRef.current?.close();
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl mb-2">Local Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full bg-black rounded"
          />
        </div>
        <div>
          <h2 className="text-xl mb-2">Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full bg-black rounded"
          />
        </div>
      </div>
      <div className="mt-4 text-center">
        {isConnected ? (
          <span className="text-green-500">Connected to peer</span>
        ) : (
          <span className="text-yellow-500">Connecting...</span>
        )}
      </div>
    </div>
  );
};

export default App;
