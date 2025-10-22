// src/socketClient.ts
import { io } from "socket.io-client";
import { API_BASE_URL } from "./environments/env";

export const socket = io(API_BASE_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});
