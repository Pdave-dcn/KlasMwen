import { useMemo } from "react";

import {
  useChatGroupQuery,
  useChatGroupsQuery,
  useChatMembersQuery,
  useChatMessagesQuery,
} from "@/queries/chat";

export const useCircleData = (groupId: string | null) => {
  const { data: groups = [], isLoading: isLoadingCircles } =
    useChatGroupsQuery();

  const { data: selectedCircle, isLoading: isLoadingCircle } =
    useChatGroupQuery(groupId ?? "");

  const { data: members = [], isLoading: isLoadingMembers } =
    useChatMembersQuery(groupId ?? "");

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useChatMessagesQuery(groupId ?? "");

  const messages = useMemo(
    () =>
      messagesData
        ? [...messagesData.pages.flatMap((p) => p.data)].reverse()
        : [],
    [messagesData],
  );

  return {
    groups,
    selectedCircle,
    members,
    messages,
    isLoadingCircles,
    isLoadingCircle,
    isLoadingMembers,
    isLoadingMessages,
    isFetchingNextPage,
    pagination: { fetchNextPage, hasNextPage },
  };
};
