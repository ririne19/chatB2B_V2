"use client";

import Link from "next/link";

export default function ConversationsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-400"
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
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Sélectionnez une conversation
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Choisissez une conversation dans la liste ou créez-en une nouvelle
        </p>
        <Link
          href="/conversations"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Voir la liste
        </Link>
      </div>
    </div>
  );
}
