import { io } from "socket.io-client";

// Initialize the Socket.IO connection
// Use environment variable for backend URL
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const socket = io(SOCKET_URL);

// Log socket connection events
socket.on("connect", () => {
  console.log("🔌 [Socket] Connected to server:", socket.id);
  console.log("🔌 [Socket] Server URL:", SOCKET_URL);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 [Socket] Disconnected from server. Reason:", reason);
});

socket.on("connect_error", (error) => {
  console.error("🔌 [Socket] Connection error:", error.message);
});

socket.on("reconnect", (attemptNumber) => {
  console.log("🔌 [Socket] Reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log("🔌 [Socket] Reconnection attempt", attemptNumber);
});

export default socket;
