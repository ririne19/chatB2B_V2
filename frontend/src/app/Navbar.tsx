"use client";

import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import { ConnectionIndicator } from "@/src/contexts/SocketContext";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link
            href="/"
            className="text-xl font-semibold text-blue-600 hover:text-blue-700"
          >
            ENTREPRISE DEMO
          </Link>
          <div className="flex items-center gap-4">
            {loading ? (
              <span className="text-slate-500 text-sm">Chargement...</span>
            ) : user ? (
              <>
                <ConnectionIndicator />
                <span className="text-slate-600 text-sm hidden sm:inline">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
