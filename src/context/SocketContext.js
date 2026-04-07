import { io } from "socket.io-client";

const socket = io("https://brown-dragons-drive.loca.lt", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  autoConnect: false,
  extraHeaders: { "bypass-tunnel-reminder": "true" },
});

export default socket;