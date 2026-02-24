import { useMemo } from "react";

import {
  useCircleMembersQuery,
  useCircleMessagesQuery,
  useStudyCircleQuery,
  useStudyCirclesQuery,
} from "@/queries/circle";

export const useCircleData = (circleId: string | null) => {
  const { data: groups = [], isLoading: isLoadingCircles } =
    useStudyCirclesQuery();

  const { data: selectedCircle, isLoading: isLoadingCircle } =
    useStudyCircleQuery(circleId ?? "");

  const { data: members = [], isLoading: isLoadingMembers } =
    useCircleMembersQuery(circleId ?? "");

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useCircleMessagesQuery(circleId ?? "");

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
