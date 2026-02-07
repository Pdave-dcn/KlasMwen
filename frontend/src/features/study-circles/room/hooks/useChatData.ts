import { useMemo } from "react";

import {
  useChatGroupQuery,
  useChatGroupsQuery,
  useChatMembersQuery,
  useChatMessagesQuery,
} from "@/queries/chat";

export const useChatData = (groupId: string | null) => {
  const { data: groups = [], isLoading: isLoadingGroups } =
    useChatGroupsQuery();

  const { data: selectedGroup, isLoading: isLoadingGroup } = useChatGroupQuery(
    groupId ?? "",
  );

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
    selectedGroup,
    members,
    messages,
    isLoadingGroups,
    isLoadingGroup,
    isLoadingMembers,
    isLoadingMessages,
    isFetchingNextPage,
    pagination: { fetchNextPage, hasNextPage },
  };
};
