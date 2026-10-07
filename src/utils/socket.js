import { io } from "socket.io-client";
import { BASE_URL } from "./api.js";

// API calls use /api. Socket.IO must use the site root, or nginx sends it to the wrong place.
const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, "");

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const emitWithAck = (event, payload, timeoutMs = 8000) =>
  new Promise((resolve) => {
    connectSocket()
      .timeout(timeoutMs)
      .emit(event, payload, (err, response) => {
        resolve(err ? { ok: false, error: "Server did not respond. Check your connection." } : response);
      });
  });
