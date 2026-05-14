import { format } from "date-fns";

import { cn } from "@/lib/utils";
import type { CircleMessage } from "@/zodSchemas/circle.zod";

import { UserAvatar } from "../UserAvatar";

interface MessageBubbleProps {
  message: CircleMessage;
  currentUserId: string;
  showSender?: boolean;
}

export function MessageBubble({
  message,
  currentUserId,
  showSender = true,
}: MessageBubbleProps) {
  const isSent = message.sender.id === currentUserId;
  const timestamp = format(new Date(message.createdAt), "HH:mm");

  return (
    <div className={cn("flex gap-2", isSent ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar - only show for received messages */}
      {!isSent && showSender && (
        <UserAvatar user={message.sender} size="sm" className="" />
      )}

      {!isSent && !showSender && <div className="w-8" />}

      {/* Message Content */}
      <div
        className={cn(
          "max-w-[70%] flex flex-col",
          isSent ? "items-end" : "items-start",
        )}
      >
        {/* Sender name - only for received messages */}
        {!isSent && showSender && (
          <span
            data-testid="sender-name"
            className="text-xs font-medium text-muted-foreground mb-1 ml-1"
          >
            {message.sender.username}
          </span>
        )}

        {/* Bubble */}
        <div
          data-testid="message-bubble"
          className={cn(
            "px-4 py-2.5 rounded-2xl",
            isSent
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
          )}
        >
          <p className="text-sm whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <span
          data-testid="timestamp"
          className="text-[10px] text-muted-foreground mt-1 mx-1"
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
}
