import { io } from "socket.io-client";

// Yaha paste karein socket initialization
const socket = io("http://localhost:5007", {
    transports: ["websocket"]
});

export default socket;