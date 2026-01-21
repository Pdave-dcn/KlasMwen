import { useEffect, useRef } from "react";

import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { MessageSquare } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/zodSchemas/chat.zod";

import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
}

function DateDivider({ date }: { date: Date }) {
  let label: string;

  if (isToday(date)) {
    label = "Today";
  } else if (isYesterday(date)) {
    label = "Yesterday";
  } else {
    label = format(date, "MMMM d, yyyy");
  }

  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-medium text-muted-foreground px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={`items-${i + 1}`}
            className={`flex gap-2 ${i % 3 === 0 ? "flex-row-reverse" : "flex-row"}`}
          >
            {i % 3 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <div
              className={`space-y-2 ${i % 3 === 0 ? "items-end" : "items-start"} flex flex-col`}
            >
              <Skeleton className="h-10 w-48 rounded-2xl" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm">Be the first to say hello!</p>
      </div>
    );
  }

  // Group messages by date and determine when to show sender info
  const groupedMessages: {
    date: Date;
    messages: { message: ChatMessage; showSender: boolean }[];
  }[] = [];

  messages.forEach((message, index) => {
    const messageDate = new Date(message.createdAt);
    const prevMessage = messages[index - 1];

    // Determine if we should show sender info
    const showSender =
      prevMessage?.sender.id !== message.sender.id ||
      !isSameDay(new Date(prevMessage.createdAt), messageDate);

    // Find or create date group
    const existingGroup = groupedMessages.find((g) =>
      isSameDay(g.date, messageDate),
    );

    if (existingGroup) {
      existingGroup.messages.push({ message, showSender });
    } else {
      groupedMessages.push({
        date: messageDate,
        messages: [{ message, showSender }],
      });
    }
  });

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-thin p-4"
    >
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          <DateDivider date={group.date} />
          <div className="space-y-3">
            {group.messages.map(({ message, showSender }) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                showSender={showSender}
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
