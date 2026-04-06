import { io } from "socket.io-client";

const socket = io("http://100.77.40.41:5007", {
    transports: ["websocket"]
});

export default socket;