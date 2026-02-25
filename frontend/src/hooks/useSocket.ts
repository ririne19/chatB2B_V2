"use client";

import { useEffect, useState } from "react";
import { initSocket, disconnectSocket, getSocket } from "@/src/lib/socket";

const TOKEN_KEY = "token";

/**
 * Hook qui initialise le socket au mount avec le token (AuthContext ou localStorage),
 * se déconnecte au unmount ou quand token est absent.
 */
export function useSocket(token: string | null) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = token ?? localStorage.getItem(TOKEN_KEY);
    if (!t) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    const socket = initSocket(t);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      disconnectSocket();
      setIsConnected(false);
    };
  }, [token]);

  return { socket: getSocket(), isConnected };
}
