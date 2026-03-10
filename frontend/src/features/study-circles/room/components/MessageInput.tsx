import { useState, useRef, useCallback, type KeyboardEvent } from "react";

import { Send, AlertCircle, Smile, Paperclip } from "lucide-react";

import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string) => void;
  onAttach?: (file: File) => void;
  disabled?: boolean;
  isMuted?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onAttach,
  disabled = false,
  isMuted = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleEmojiClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttach) {
      onAttach(file);
    }
    // Reset so the same file can be selected again
    e.target.value = "";
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
          "flex items-end gap-2 bg-muted rounded-2xl px-4 py-3 transition-all",
          isDisabled
            ? "opacity-50"
            : "focus-within:ring-2 focus-within:ring-primary/20",
        )}
      >
        {/* Textarea */}
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

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Emoji — inputmode trick opens native OS picker on mobile */}
          <button
            type="button"
            disabled={isDisabled}
            onClick={handleEmojiClick}
            inputMode="none"
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isDisabled
                ? "cursor-not-allowed text-muted-foreground/40"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )}
            aria-label="Insert emoji"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Attach file */}
          <button
            type="button"
            disabled={isDisabled}
            onClick={handleAttachClick}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isDisabled
                ? "cursor-not-allowed text-muted-foreground/40"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )}
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={isDisabled || !content.trim()}
            className={cn(
              "p-2 rounded-xl transition-all",
              content.trim() && !isDisabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed",
            )}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled
      />
    </div>
  );
}
