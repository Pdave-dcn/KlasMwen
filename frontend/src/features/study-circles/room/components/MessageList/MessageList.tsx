import { Loader2 } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { CircleMessage } from "@/zodSchemas/circle.zod";

import { useMessageList } from "../../hooks/useMessageList";

import { DateDivider } from "./DateDivider";
import { EmptyState } from "./EmptyState";
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
  const {
    endRef,
    scrollAreaRef,
    topSentinelRef,
    isMessagesEmpty,
    isLoadingState,
    groupedMessages,
  } = useMessageList({ messages, isLoading, pagination });

  if (isMessagesEmpty) return <EmptyState />;

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
