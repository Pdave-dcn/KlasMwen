import { useMemo } from "react";

import {
  useChatGroupQuery,
  useChatGroupsQuery,
  useChatMembersQuery,
  useChatMessagesQuery,
} from "@/queries/chat.query";
import { useChatStore } from "@/stores/chat.store";
import { usePresenceStore } from "@/stores/presence.store";

export const useChatData = (groupId: string | null) => {
  const { onlineUsers } = usePresenceStore();
  const { presentUserIds } = useChatStore();

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

  const enrichedMembers = useMemo(
    () =>
      members.map((member) => ({
        ...member,
        isOnline: onlineUsers.has(member.userId),
        isPresent: presentUserIds.has(member.userId),
      })),
    [members, onlineUsers, presentUserIds],
  );

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
    enrichedMembers,
    messages,
    isLoadingGroups,
    isLoadingGroup,
    isLoadingMembers,
    isLoadingMessages,
    isFetchingNextPage,
    pagination: { fetchNextPage, hasNextPage },
  };
};
