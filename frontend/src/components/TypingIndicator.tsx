"use client";

export interface TypingUser {
  userId: string;
  firstName: string;
  lastName: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;
  const label =
    users.length === 1
      ? `${users[0].firstName} est en train d'écrire`
      : `${users.length} personnes sont en train d'écrire`;

  return (
    <div className="px-4 py-2 text-sm text-slate-500 flex items-center gap-1.5">
      <span>{label}</span>
      <span className="inline-flex gap-0.5" aria-hidden>
        <span
          className="w-1.5 h-1.5 rounded-full bg-slate-400"
          style={{ animation: "typing 1.4s ease-in-out infinite", animationDelay: "0s" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-slate-400"
          style={{ animation: "typing 1.4s ease-in-out infinite", animationDelay: "0.2s" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-slate-400"
          style={{ animation: "typing 1.4s ease-in-out infinite", animationDelay: "0.4s" }}
        />
      </span>
    </div>
  );
}
