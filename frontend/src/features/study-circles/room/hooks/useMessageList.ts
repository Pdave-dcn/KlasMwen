import { useLayoutEffect, useRef } from "react";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { CircleMessage } from "@/zodSchemas/circle.zod";

import { groupMessagesByDate } from "../components/MessageList/helpers"; 

interface UseMessageListProps {
  messages: CircleMessage[];
  isLoading: boolean;
  pagination: {
    fetchNextPage: () => void;
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean;
    isFetching: boolean;
  };
}

export const useMessageList = ({
  messages,
  isLoading,
  pagination,
}: UseMessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  const isMessagesEmpty = messages.length === 0;
  const isLoadingState =
    isLoading || (pagination.isFetching && messages.length === 0);

  // Jump to the latest message before the browser paints — no animation.
  // Only fires on empty → populated transition.
  useLayoutEffect(() => {
    if (isMessagesEmpty) return;
    endRef.current?.scrollIntoView({ behavior: "instant" });
  }, [isMessagesEmpty]);

  // Preserve scroll position when older messages are prepended at the top.
  // Snapshot the scroll height before the update, then restore the offset after.
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

  const groupedMessages = groupMessagesByDate(messages);

  return {
    endRef,
    scrollAreaRef,
    topSentinelRef,
    isMessagesEmpty,
    isLoadingState,
    groupedMessages,
  };
};