"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketContext } from "@/src/contexts/SocketContext";

const MAX_CHARS = 5000;
const TYPING_DEBOUNCE_MS = 2000;

interface MessageInputProps {
  onSend: (content: string) => Promise<unknown>;
  conversationId?: string | null;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  conversationId = null,
  disabled = false,
  placeholder = "Écrivez votre message...",
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEmittedTypingStartRef = useRef(false);
  const { socket, isConnected } = useSocketContext();

  const canSend = value.trim().length > 0 && !disabled && !isSubmitting;

  const emitTypingStop = useCallback(() => {
    if (conversationId && isConnected && socket) {
      socket.emit("typing:stop", { conversationId });
      hasEmittedTypingStartRef.current = false;
    }
  }, [conversationId, isConnected, socket]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      emitTypingStop();
    };
  }, [emitTypingStop]);

  const handleSubmit = async () => {
    if (!canSend) return;
    emitTypingStop();
    const content = value.trim();
    setValue("");
    setIsSubmitting(true);
    try {
      await onSend(content);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (v.length <= MAX_CHARS) setValue(v);

    if (!conversationId || !isConnected || !socket) return;
    if (v.trim().length === 0) {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = null;
      }
      emitTypingStop();
      return;
    }
    if (!hasEmittedTypingStartRef.current) {
      hasEmittedTypingStartRef.current = true;
      socket.emit("typing:start", { conversationId });
    }
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
      emitTypingStop();
    }, TYPING_DEBOUNCE_MS);
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 min-h-[44px] max-h-[200px]"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className="px-5 py-3 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {isSubmitting ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Envoyer"
          )}
        </button>
      </div>
      <p
        className={`mt-1 text-xs ${
          value.length > MAX_CHARS * 0.9 ? "text-amber-600" : "text-slate-400"
        }`}
      >
        {value.length}/{MAX_CHARS}
      </p>
    </div>
  );
}
