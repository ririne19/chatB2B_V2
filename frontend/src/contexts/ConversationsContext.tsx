"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/src/lib/axios";
import { useSocketContext } from "@/src/contexts/SocketContext";
import type { Conversation } from "@/src/types";

interface ConversationsContextValue {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  createConversation: (options?: { title?: string; partnerOrganizationSlug?: string }) => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<boolean>;
  setError: (err: string | null) => void;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(
  null
);

export function ConversationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;
    const onCreated = (conversation: Conversation) => {
      setConversations((prev) => {
        if (prev.some((c) => c.id === conversation.id)) return prev;
        return [conversation, ...prev];
      });
    };
    const onDeleted = (payload: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== payload.conversationId));
    };
    socket.on("conversation:created", onCreated);
    socket.on("conversation:deleted", onDeleted);
    return () => {
      socket.off("conversation:created", onCreated);
      socket.off("conversation:deleted", onDeleted);
    };
  }, [socket]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; data: Conversation[] }>(
        "/api/conversations"
      );
      if (data.success && data.data) {
        setConversations(data.data);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Erreur lors du chargement des conversations";
      setError(msg || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(
    async (options?: { title?: string; partnerOrganizationSlug?: string }): Promise<Conversation | null> => {
      setError(null);
      try {
        const { data } = await api.post<{
          success: boolean;
          data: Conversation;
        }>("/api/conversations", {
          title: options?.title,
          partnerOrganizationSlug: options?.partnerOrganizationSlug,
        });
        if (data.success && data.data) {
          setConversations((prev) => [data.data!, ...prev]);
          return data.data;
        }
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : "Erreur lors de la création";
        setError(msg || "Erreur réseau");
      }
      return null;
    },
    []
  );

  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const { data } = await api.delete<{
        success: boolean;
        data?: { message: string };
      }>(`/api/conversations/${id}`);
      if (data.success) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        return true;
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Erreur lors de la suppression";
      setError(msg || "Erreur réseau");
    }
    return false;
  }, []);

  const value: ConversationsContextValue = {
    conversations,
    loading,
    error,
    fetchConversations,
    createConversation,
    deleteConversation,
    setError,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversationsContext() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error(
      "useConversationsContext must be used within ConversationsProvider"
    );
  }
  return ctx;
}
