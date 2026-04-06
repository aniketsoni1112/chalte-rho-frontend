import { io } from "socket.io-client";

const socket = io("http://localhost:5007", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  autoConnect: false, // we control connect/disconnect manually
});

export default socket;