import { useLayoutEffect, useRef } from "react";

import { Loader2 } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { CircleMessage } from "@/zodSchemas/circle.zod";

import { DateDivider } from "./DateDivider";
import { EmptyState } from "./EmptyState";
import { groupMessagesByDate } from "./helpers";
import { LoadingState } from "./LoadingState";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: CircleMessage[];
  currentUserId: string;
  isLoading: boolean;
  pagination: {
    fetchNextPage: () => void;
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean;
    isFetching: boolean;
  };
}

export const MessageList = ({
  messages,
  currentUserId,
  isLoading,
  pagination,
}: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isMessagesEmpty = messages.length === 0;

  // Jump to the latest message before the browser paints — no animation,
  useLayoutEffect(() => {
    if (isMessagesEmpty) return;
    endRef.current?.scrollIntoView({ behavior: "instant" });
  }, [isMessagesEmpty]); // only fires on empty → populated transition

  // Preserve scroll position when older messages are prepended at the top.
  // Snapshot the scroll height before the update, then restore the offset after.
  const prevScrollHeightRef = useRef<number>(0);

  useLayoutEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;

    if (!viewport) return;

    if (pagination.isFetchingNextPage) {
      prevScrollHeightRef.current = viewport.scrollHeight;
    } else if (prevScrollHeightRef.current > 0) {
      const diff = viewport.scrollHeight - prevScrollHeightRef.current;
      viewport.scrollTop += diff;
      prevScrollHeightRef.current = 0;
    }
  }, [pagination.isFetchingNextPage, messages.length]);

  // Sentinel at the TOP — messages are reversed so older messages load upward
  const topSentinelRef = useInfiniteScroll({
    hasNextPage: pagination.hasNextPage ?? false,
    isFetchingNextPage: pagination.isFetchingNextPage,
    fetchNextPage: pagination.fetchNextPage,
  });

  const isLoadingState =
    isLoading || (pagination.isFetching && messages.length === 0);

  if (isMessagesEmpty) return <EmptyState />;
  if (messages.length === 0) return <EmptyState />;

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex-1 min-h-0 w-full relative" ref={scrollAreaRef}>
      <ScrollArea className="h-full w-full">
        <div className="p-4 pb-14">
          {isLoadingState ? (
            <LoadingState />
          ) : (
            <>
              {/* Sentinel — triggers fetchNextPage when scrolled into view */}
              <div ref={topSentinelRef} />

              {/* Loading indicator for older messages */}
              {pagination.isFetchingNextPage && (
                <div className="flex justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

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
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
