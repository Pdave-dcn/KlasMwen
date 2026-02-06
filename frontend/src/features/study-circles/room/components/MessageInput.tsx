import { useState, useRef, useCallback, type KeyboardEvent } from "react";

import { Send, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  isMuted?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  isMuted = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed && !disabled && !isMuted) {
      onSend(trimmed);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [content, onSend, disabled, isMuted]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const isDisabled = disabled || isMuted;

  return (
    <div className="border-t border-border bg-card p-4">
      {isMuted && (
        <div className="flex items-center gap-2 text-destructive text-sm mb-3 bg-destructive/10 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>You are muted in this chat</span>
        </div>
      )}

      <div
        className={cn(
          "flex items-end gap-3 bg-muted rounded-2xl px-4 py-3 transition-all",
          isDisabled
            ? "opacity-50"
            : "focus-within:ring-2 focus-within:ring-primary/20",
        )}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={isMuted ? "You cannot send messages" : placeholder}
          rows={1}
          className={cn(
            "flex-1 bg-transparent resize-none text-sm placeholder:text-muted-foreground",
            "focus:outline-none max-h-30",
            isDisabled && "cursor-not-allowed",
          )}
        />

        <button
          onClick={handleSend}
          disabled={isDisabled || !content.trim()}
          className={cn(
            "shrink-0 p-2 rounded-xl transition-all",
            content.trim() && !isDisabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
              : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed",
          )}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
          Enter
        </kbd>{" "}
        to send,{" "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
          Shift + Enter
        </kbd>{" "}
        for new line
      </p>
    </div>
  );
}
