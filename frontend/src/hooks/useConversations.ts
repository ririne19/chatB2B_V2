"use client";

import { useCallback, useState } from "react";
import { api } from "@/src/lib/axios";
import type { Conversation } from "@/src/types";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    async (title?: string): Promise<Conversation | null> => {
      setError(null);
      try {
        const { data } = await api.post<{
          success: boolean;
          data: Conversation;
        }>("/api/conversations", { title });
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

  const deleteConversation = useCallback(
    async (id: string): Promise<boolean> => {
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
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : "Erreur lors de la suppression";
        setError(msg || "Erreur réseau");
      }
      return false;
    },
    []
  );

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    createConversation,
    deleteConversation,
    setError,
  };
}
