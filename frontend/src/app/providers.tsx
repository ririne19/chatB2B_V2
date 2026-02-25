"use client";

import { AuthProvider } from "@/src/contexts/AuthContext";
import { SocketProvider } from "@/src/contexts/SocketContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>{children}</SocketProvider>
    </AuthProvider>
  );
}
