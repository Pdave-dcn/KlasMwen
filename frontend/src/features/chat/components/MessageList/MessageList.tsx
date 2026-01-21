import { useEffect, useRef } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/zodSchemas/chat.zod";

import { DateDivider } from "./DateDivider";
import { EmptyState } from "./EmptyState";
import { groupMessagesByDate } from "./helpers";
import { LoadingState } from "./LoadingState";
import { MessageBubble } from "./MessageBubble";
// 1. Import Shadcn ScrollArea

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
}

export const MessageList = ({
  messages,
  currentUserId,
  isLoading,
}: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adding a slight delay ensures Radix has calculated the viewport height
    const timer = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  if (isLoading) return <LoadingState />;
  if (messages.length === 0) return <EmptyState />;

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex-1 min-h-0 w-full relative">
      <ScrollArea className="h-full w-full">
        <div className="p-4 pb-14">
          {groupedMessages.map((group, groupIndex) => (
            <div key={`group-${groupIndex + 1}`}>
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
          <div ref={endRef} className="h-px" />
        </div>
      </ScrollArea>
    </div>
  );
};
