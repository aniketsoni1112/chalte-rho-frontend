import { io } from "socket.io-client";
import { TUNNEL_URL } from "../services/api";

const socket = io(TUNNEL_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  autoConnect: false,
});

export default socket;
