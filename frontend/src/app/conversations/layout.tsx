"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { ConnectionIndicator } from "@/src/contexts/SocketContext";
import { ConversationsProvider, useConversationsContext } from "@/src/contexts/ConversationsContext";
import { ConversationList } from "@/src/components/ConversationList";

function ConversationsLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const { createConversation } = useConversationsContext();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isInConversation = pathname?.match(/^\/conversations\/[^/]+$/);
  const hasConversationSelected = !!isInConversation;

  useEffect(() => {
    if (hasConversationSelected) {
      setMobileShowChat(true);
    } else {
      setMobileShowChat(false);
    }
  }, [hasConversationSelected]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleCreateNew = useCallback(async () => {
    const conv = await createConversation();
    if (conv) {
      window.location.href = `/conversations/${conv.id}`;
    }
  }, [createConversation]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <span className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/conversations"
              className="text-xl font-bold text-blue-600 hover:text-blue-700"
            >
              Chat B2B
            </Link>
            {hasConversationSelected && (
              <button
                type="button"
                onClick={() => setMobileShowChat(false)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                aria-label="Retour à la liste"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ConnectionIndicator />
            <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-700">
                {user.firstName} {user.lastName}
              </span>
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 py-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">
                  {user.email}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside
          className={`${
            mobileShowChat ? "hidden md:flex" : "flex"
          } w-full md:w-[300px] flex-shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col`}
        >
          <ConversationList onCreateNew={handleCreateNew} />
        </aside>
        <main
          className={`${
            mobileShowChat ? "flex" : "hidden md:flex"
          } flex-1 flex flex-col min-w-0 bg-white`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConversationsProvider>
      <ConversationsLayoutInner>{children}</ConversationsLayoutInner>
    </ConversationsProvider>
  );
}
