"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSocket } from "@/src/hooks/useSocket";

const TOKEN_KEY = "token";

interface SocketContextValue {
  socket: ReturnType<typeof import("socket.io-client").io> | null;
  isConnected: boolean;
  emit: <E extends string>(event: E, ...args: unknown[]) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const token =
    typeof window !== "undefined" && user
      ? localStorage.getItem(TOKEN_KEY)
      : null;
  const { socket, isConnected } = useSocket(token);

  const [toast, setToast] = useState<{ message: string; type: "error" | "info" } | null>(null);
  const [prevConnected, setPrevConnected] = useState<boolean | null>(null);

  const emit = useCallback(
    <E extends string>(event: E, ...args: unknown[]) => {
      socket?.emit(event, ...args);
    },
    [socket]
  );

  useEffect(() => {
    if (socket) {
      const onError = (payload: { message?: string }) => {
        setToast({
          message: payload?.message ?? "Erreur socket",
          type: "error",
        });
      };
      socket.on("error", onError);
      return () => {
        socket.off("error", onError);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (prevConnected === null) {
      setPrevConnected(isConnected);
      return;
    }
    if (prevConnected !== isConnected) {
      setToast({
        message: isConnected ? "Connecté en temps réel" : "Déconnecté — reconnexion…",
        type: "info",
      });
      setPrevConnected(isConnected);
    }
  }, [isConnected, prevConnected]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const value: SocketContextValue = {
    socket,
    isConnected,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-slate-800 text-white"
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocketContext must be used within SocketProvider");
  }
  return ctx;
}

/** Pastille verte/rouge pour la navbar */
export function ConnectionIndicator() {
  const { isConnected } = useSocketContext();
  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0"
      title={isConnected ? "Connecté" : "Déconnecté"}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          isConnected ? "bg-emerald-500" : "bg-red-500"
        }`}
        aria-hidden
      />
      <span className="text-xs text-slate-500 hidden sm:inline">
        {isConnected ? "Temps réel" : "Hors ligne"}
      </span>
    </span>
  );
}
