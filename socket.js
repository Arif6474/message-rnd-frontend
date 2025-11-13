import { io } from "socket.io-client";

// Initialize the Socket.IO connection
const socket = io("http://localhost:5001");  // Replace with your backend URL

export default socket;
