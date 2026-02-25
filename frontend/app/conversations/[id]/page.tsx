"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { useConversationsContext } from "@/src/contexts/ConversationsContext";
import { useMessages } from "@/src/hooks/useMessages";
import { MessageInput } from "@/src/components/MessageInput";
import { api } from "@/src/lib/axios";
import { formatRelativeTime, getInitials } from "@/src/lib/utils";
import type { Conversation, Message } from "@/src/types";

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const initials = getInitials(
    message.sender.firstName,
    message.sender.lastName
  );
  const name = `${message.sender.firstName} ${message.sender.lastName}`;

  return (
    <div
      className={`flex gap-3 ${
        isOwn ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
          isOwn ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
        }`}
      >
        {initials}
      </div>
      <div
        className={`flex flex-col max-w-[75%] ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        <span className="text-xs font-medium text-slate-500 mb-0.5">{name}</span>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-slate-100 text-slate-800 rounded-bl-md"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <span className="text-xs text-slate-400 mt-1">
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-3 animate-pulse">
        <div className="w-9 h-9 rounded-full bg-slate-200" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
          <div className="h-12 bg-slate-100 rounded-2xl w-3/4" />
        </div>
      </div>
      <div className="flex gap-3 flex-row-reverse animate-pulse">
        <div className="w-9 h-9 rounded-full bg-slate-200" />
        <div className="flex-1 flex flex-col items-end">
          <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
          <div className="h-10 bg-slate-100 rounded-2xl w-1/2" />
        </div>
      </div>
      <div className="flex gap-3 animate-pulse">
        <div className="w-9 h-9 rounded-full bg-slate-200" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
          <div className="h-16 bg-slate-100 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const {
    conversations,
    fetchConversations,
    deleteConversation,
    loading: convLoading,
  } = useConversationsContext();

  const conversation = conversations.find((c) => c.id === id);
  const [fetchedConversation, setFetchedConversation] =
    useState<Conversation | null>(null);
  const conv = conversation ?? fetchedConversation;
  const myOrgId = user?.organization?.id ?? "";
  const counterpartName =
    conv && myOrgId
      ? conv.organizationId === myOrgId
        ? conv.partnerOrganization?.name ?? "Client"
        : conv.organization?.name ?? "Support"
      : null;
  const title =
    conv?.title ?? counterpartName ?? "Conversation";

  useEffect(() => {
    if (!conversation && id) {
      api
        .get<{ success: boolean; data: Conversation }>(`/api/conversations/${id}`)
        .then((res) => {
          if (res.data.success && res.data.data) {
            setFetchedConversation(res.data.data);
          }
        })
        .catch(() => {});
    } else {
      setFetchedConversation(null);
    }
  }, [id, conversation]);

  const {
    messages,
    loading: msgLoading,
    sending,
    error: msgError,
    fetchMessages,
    sendMessage,
    setError: setMsgError,
  } = useMessages(id);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!conversation && !convLoading) {
      fetchConversations();
    }
  }, [id, conversation, convLoading, fetchConversations]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Supprimer cette conversation ?")) return;
    setDeleting(true);
    const ok = await deleteConversation(id);
    setDeleting(false);
    if (ok) router.push("/conversations");
  }, [id, deleteConversation, router]);

  if (!id) return null;

  const loading = convLoading || msgLoading;

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
        <h1 className="font-semibold text-slate-900 truncate">{title}</h1>
        {user?.role === "ADMIN" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Supprimer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {msgError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between gap-2">
            <span>{msgError}</span>
            <button
              type="button"
              onClick={() => {
                setMsgError(null);
                fetchMessages();
              }}
              className="px-2 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 rounded transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Aucun message</p>
            <p className="text-slate-400 text-xs mt-1">
              Envoyez le premier message
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSend={sendMessage}
        conversationId={id}
        disabled={sending}
        placeholder="Écrivez votre message..."
      />
    </div>
  );
}
