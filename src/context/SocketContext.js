import { io } from "socket.io-client";
import { BASE_URL } from "../services/api";

const socket = io(BASE_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  autoConnect: true,
});

export default socket;
