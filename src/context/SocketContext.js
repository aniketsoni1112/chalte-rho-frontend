import { io } from "socket.io-client";

const socket = io("http://localhost:5007", {
  transports: ["websocket", "polling"], // polling fallback prevents silent disconnect
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export default socket;