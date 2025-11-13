import { io } from "socket.io-client";

// Initialize the Socket.IO connection
// Use environment variable for backend URL
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;
const socket = io(SOCKET_URL);

export default socket;
