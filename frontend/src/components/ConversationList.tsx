"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { useConversationsContext } from "@/src/contexts/ConversationsContext";
import { NewConversationModal } from "@/src/components/NewConversationModal";
import { formatRelativeTime } from "@/src/lib/utils";
import type { Conversation } from "@/src/types";

/** Nom de l'autre partie (client ou support) selon qui je suis dans la conversation */
function getCounterpartName(conv: Conversation, myOrgId: string): string {
  if (conv.organizationId === myOrgId) {
    return conv.partnerOrganization?.name ?? "Client";
  }
  return conv.organization?.name ?? "Support";
}

interface ConversationListProps {
  onCreateNew?: () => void;
}

function ConversationSkeleton() {
  return (
    <div className="p-3 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-full mb-1" />
      <div className="h-3 bg-slate-100 rounded w-1/4" />
    </div>
  );
}

export function ConversationList({ onCreateNew }: ConversationListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const myOrgId = user?.organization?.id ?? "";
  const {
    conversations,
    loading,
    error,
    fetchConversations,
    createConversation,
    setError,
  } = useConversationsContext();
  const activeId = pathname?.split("/").pop();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleCreateSubmit = async (options: { title?: string; partnerOrganizationSlug?: string }) => {
    const conv = await createConversation(options);
    if (conv) {
      setModalOpen(false);
      router.push(`/conversations/${conv.id}`);
    }
  };

  const getPreview = (conv: Conversation): string => {
    if (!conv.messages?.length) return "Aucun message";
    const last = conv.messages[0];
    const text = last.content;
    return text.length > 50 ? `${text.slice(0, 50)}…` : text;
  };

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            fetchConversations();
          }}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="m-3 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <span className="text-lg leading-none">+</span>
        {user?.organization?.isAdminCompany ? "Conversation client" : "Contacter le support"}
      </button>
      <NewConversationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            {user?.organization?.isAdminCompany
              ? "Les conversations avec vos clients apparaîtront ici."
              : "Ouvrez une conversation pour contacter le support (après-vente)."}
          </div>
        ) : (
          <div className="space-y-0.5 pb-2">
            {conversations.map((conv) => {
              const isActive = activeId === conv.id;
              const lastMessage = conv.messages?.[0];
              const updatedAt = lastMessage?.createdAt ?? conv.updatedAt;

              return (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className={`block p-3 mx-2 rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 border border-blue-200 text-blue-900"
                      : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-medium text-sm truncate flex-1">
                      {conv.title || (myOrgId ? getCounterpartName(conv, myOrgId) : "Conversation")}
                    </h3>
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatRelativeTime(updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {getPreview(conv)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
