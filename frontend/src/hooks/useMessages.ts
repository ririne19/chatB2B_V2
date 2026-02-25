"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/src/lib/axios";
import { useSocketContext } from "@/src/contexts/SocketContext";
import type { Message } from "@/src/types";

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocketContext();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{
        success: boolean;
        data: Message[];
      }>(`/api/conversations/${conversationId}/messages`);
      if (data.success && data.data) {
        setMessages(data.data.reverse());
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Erreur lors du chargement des messages";
      setError(msg || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    fetchMessages();
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    const onMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };
    socket.on("message:received", onMessage);
    return () => {
      socket.off("message:received", onMessage);
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback(
    async (content: string): Promise<Message | null> => {
      if (!conversationId || !content.trim()) return null;
      setSending(true);
      setError(null);
      try {
        if (isConnected && socket) {
          return new Promise((resolve) => {
            const timeout = setTimeout(() => {
              setSending(false);
              resolve(null);
            }, 8000);
            const onReceived = (message: Message) => {
              if (message.conversationId === conversationId) {
                clearTimeout(timeout);
                socket.off("message:received", onReceived);
                setMessages((prev) => {
                  if (prev.some((m) => m.id === message.id)) return prev;
                  return [...prev, message];
                });
                setSending(false);
                resolve(message);
              }
            };
            socket.once("message:received", onReceived);
            socket.emit("message:send", {
              conversationId,
              content: content.trim(),
            });
          });
        }
        const { data } = await api.post<{
          success: boolean;
          data: Message;
        }>(`/api/conversations/${conversationId}/messages`, {
          content: content.trim(),
        });
        if (data.success && data.data) {
          setMessages((prev) => [...prev, data.data!]);
          return data.data;
        }
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : "Erreur lors de l'envoi";
        setError(msg || "Erreur réseau");
      } finally {
        setSending(false);
      }
      return null;
    },
    [conversationId, isConnected, socket]
  );

  return {
    messages,
    loading,
    sending,
    error,
    fetchMessages,
    sendMessage,
    setError,
  };
}
