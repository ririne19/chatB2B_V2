"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/axios";
import type { User } from "@/src/types";

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    accountType: "agent" | "client";
    role?: "ADMIN" | "MEMBER";
  }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>("/api/auth/me");
      setUser(data);
      localStorage.setItem(USER_KEY, JSON.stringify(data));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ token: string; user: User }>(
        "/api/auth/login",
        { email, password }
      );
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      router.push("/conversations");
    },
    [router]
  );

  const register = useCallback(
    async (formData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      accountType: "agent" | "client";
      role?: "ADMIN" | "MEMBER";
    }) => {
      const { data } = await api.post<{ token: string; user: User }>(
        "/api/auth/register",
        formData
      );
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      router.push("/conversations");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
