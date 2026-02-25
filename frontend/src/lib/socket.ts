"use client";

import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : "http://localhost:3001";

let socketInstance: Socket | null = null;

/**
 * Initialise la connexion Socket.IO avec le token JWT.
 * Reconnexion automatique gérée par le client Socket.IO.
 */
export function initSocket(token: string): Socket {
  if (socketInstance?.connected) {
    return socketInstance;
  }
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socketInstance;
}

/**
 * Retourne l'instance socket courante (singleton).
 */
export function getSocket(): Socket | null {
  return socketInstance;
}

/**
 * Déconnecte le socket et réinitialise le singleton.
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
